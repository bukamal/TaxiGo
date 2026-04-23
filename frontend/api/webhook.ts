import { Bot } from 'grammy';
import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    const MINI_APP_URL = process.env.MINI_APP_URL;

    if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY || !MINI_APP_URL) {
        return new Response('Missing environment variables', { status: 500 });
    }

    const bot = new Bot(BOT_TOKEN);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false },
    });

    // تعريف الأوامر
    bot.command('start', async (c) => {
        const user = c.from;
        if (!user) return;
        const { data: profile } = await supabase
            .from('profiles')
            .select('approval_status, role')
            .eq('telegram_id', user.id)
            .maybeSingle();
        let msg = 'مرحباً في تاكسي جو! 🚕\n';
        if (!profile) msg += 'الرجاء التسجيل عبر التطبيق.';
        else if (profile.approval_status === 'pending') msg += 'حسابك قيد المراجعة.';
        else if (profile.approval_status === 'approved') msg += `مسجل كـ ${profile.role}.`;
        else msg += 'تم رفض الحساب.';
        await c.reply(msg, {
            reply_markup: {
                inline_keyboard: [[{ text: '🚖 فتح التطبيق', web_app: { url: MINI_APP_URL } }]],
            },
        });
    });

    bot.command('admin', async (c) => {
        await c.reply('لوحة الإدارة داخل التطبيق.', {
            reply_markup: {
                inline_keyboard: [[{ text: '🔐 لوحة الإدارة', web_app: { url: `${MINI_APP_URL}/admin` } }]],
            },
        });
    });

    // استخراج المسار
    let path = '/';
    try {
        const url = new URL(request.url);
        path = url.pathname;
    } catch {
        const match = request.url.match(/^https?:\/\/[^/]+(\/[^?]*)/);
        path = match ? match[1] : '/';
    }

    // قراءة الجسم بطريقة آمنة لـ Vercel Edge
    let rawBody = '{}';
    try {
        if (request.body) {
            const reader = request.body.getReader();
            const chunks: Uint8Array[] = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            rawBody = new TextDecoder().decode(
                chunks.reduce((acc, chunk) => {
                    const tmp = new Uint8Array(acc.length + chunk.length);
                    tmp.set(acc, 0);
                    tmp.set(chunk, acc.length);
                    return tmp;
                }, new Uint8Array())
            );
        }
    } catch (e) {
        console.error('Body read error:', e);
    }

    // Webhooks من Supabase
    if (path === '/api/webhook/new-ride') return handleNewRideWebhook(rawBody, bot, supabase, MINI_APP_URL);
    if (path === '/api/webhook/new-user') return handleNewUserWebhook(rawBody, bot, supabase, MINI_APP_URL);
    if (path === '/api/webhook/ride-update') return handleRideUpdateWebhook(rawBody, bot, supabase, MINI_APP_URL);

    // Webhook تيليجرام
    try {
        const body = JSON.parse(rawBody || '{}');
        await bot.handleUpdate(body);
        return new Response('OK', { status: 200 });
    } catch (e) {
        console.error('Bot error:', e);
        return new Response('Error', { status: 500 });
    }
}

async function handleNewRideWebhook(rawBody: string, bot: Bot, supabase: any, MINI_APP_URL: string) {
    try {
        const payload = JSON.parse(rawBody);
        const ride = payload.record;
        if (!ride || ride.status !== 'pending') return new Response('Ignored', { status: 200 });
        const { data: drivers } = await supabase
            .from('profiles')
            .select('telegram_id, latitude, longitude')
            .eq('role', 'driver')
            .eq('approval_status', 'approved')
            .eq('is_online', true);
        if (!drivers?.length) return new Response('No drivers', { status: 200 });
        const nearby = drivers
            .map((d: any) => ({
                ...d,
                distance: getDistance(ride.pickup_lat, ride.pickup_lng, d.latitude, d.longitude),
            }))
            .filter((d: any) => d.distance < 10)
            .sort((a: any, b: any) => a.distance - b.distance)
            .slice(0, 5);
        const msg = `🚕 طلب جديد!\nالالتقاط: ${ride.pickup_address}\nالتوصيل: ${ride.dropoff_address}\nالأجرة: $${ride.fare}\nالمسافة: ${nearby[0]?.distance?.toFixed(1)} كم`;
        for (const d of nearby) {
            try {
                await bot.api.sendMessage(d.telegram_id, msg, {
                    reply_markup: { inline_keyboard: [[{ text: '📱 فتح', web_app: { url: `${MINI_APP_URL}/driver` } }]] },
                });
            } catch {}
        }
        return new Response(`Notified ${nearby.length} drivers`, { status: 200 });
    } catch (e) {
        return new Response('Error', { status: 500 });
    }
}

async function handleNewUserWebhook(rawBody: string, bot: Bot, supabase: any, MINI_APP_URL: string) {
    try {
        const payload = JSON.parse(rawBody);
        const user = payload.record;
        if (!user || user.approval_status !== 'pending') return new Response('Ignored', { status: 200 });
        const { data: admin } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'admin_telegram_id')
            .single();
        if (!admin?.value) return new Response('No admin', { status: 200 });
        await bot.api.sendMessage(
            admin.value,
            `🆕 ${user.role === 'driver' ? 'سائق' : 'زبون'} جديد!\n${user.first_name} ${user.last_name}\n${user.phone}`,
            {
                reply_markup: { inline_keyboard: [[{ text: '🔐 لوحة الإدارة', web_app: { url: `${MINI_APP_URL}/admin` } }]] },
            }
        );
        return new Response('Admin notified', { status: 200 });
    } catch (e) {
        return new Response('Error', { status: 500 });
    }
}

async function handleRideUpdateWebhook(rawBody: string, bot: Bot, supabase: any, MINI_APP_URL: string) {
    try {
        const payload = JSON.parse(rawBody);
        const oldR = payload.old_record;
        const newR = payload.record;
        if (!oldR || !newR || oldR.status === newR.status) return new Response('No change', { status: 200 });
        if (oldR.status === 'pending' && newR.status === 'accepted') {
            const { data: driver } = await supabase
                .from('profiles')
                .select('first_name, last_name, phone, rating')
                .eq('id', newR.driver_id)
                .single();
            const { data: cust } = await supabase.from('profiles').select('telegram_id').eq('id', newR.customer_id).single();
            if (driver && cust) {
                await bot.api.sendMessage(
                    cust.telegram_id,
                    `✅ تم قبول رحلتك!\nالسائق: ${driver.first_name} ${driver.last_name}\nالتقييم: ${driver.rating || '5.0'}\nالهاتف: ${driver.phone || 'غير متوفر'}`,
                    {
                        reply_markup: { inline_keyboard: [[{ text: '📍 تتبع', web_app: { url: `${MINI_APP_URL}/ride/${newR.id}` } }]] },
                    }
                );
            }
        }
        if (oldR.status === 'accepted' && newR.status === 'picked_up') {
            const { data: cust } = await supabase.from('profiles').select('telegram_id').eq('id', newR.customer_id).single();
            if (cust) await bot.api.sendMessage(cust.telegram_id, `🚗 السائق وصل إلى موقع الالتقاط.`);
        }
        if (newR.status === 'cancelled') {
            const uid = newR.customer_id === oldR.customer_id ? newR.driver_id : newR.customer_id;
            if (uid) {
                const { data: u } = await supabase.from('profiles').select('telegram_id').eq('id', uid).single();
                if (u) await bot.api.sendMessage(u.telegram_id, `❌ تم إلغاء الرحلة.`);
            }
        }
        return new Response('Notified', { status: 200 });
    } catch (e) {
        return new Response('Error', { status: 500 });
    }
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
