import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../context/TelegramContext'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { User, Car, Shield } from 'lucide-react'

const ADMIN_ID_KEY = 'taxigo_admin_id'

export default function RoleSelectionPage() {
    const { user: tgUser } = useTelegram()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [manualId, setManualId] = useState(localStorage.getItem(ADMIN_ID_KEY) || '')

    const handleAdminLogin = async (userId: string) => {
        if (!userId) return alert('الرجاء إدخال معرف تيليجرام')
        setLoading(true)
        
        try {
            // حذف أي قيمة سابقة خاطئة
            localStorage.removeItem(ADMIN_ID_KEY)
            
            const supabase = createSupabaseClient(userId)
            
            // التحقق من كونه أدمن
            const { data: settings, error: settingsError } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'admin_telegram_id')
                .single()

            if (settingsError) {
                alert('خطأ في جلب إعدادات الأدمن: ' + settingsError.message)
                setLoading(false)
                return
            }

            const adminId = String(settings?.value || '').replace(/"/g, '')
            if (adminId !== userId) {
                alert('هذا المعرف ليس الأدمن!')
                setLoading(false)
                return
            }

            // تخزين المعرف الصحيح
            localStorage.setItem(ADMIN_ID_KEY, userId)
            
            // إنشاء/تحديث صف الأدمن
            const { error: upsertError } = await supabase.from('profiles').upsert({
                telegram_id: userId,
                first_name: tgUser?.first_name || 'Admin',
                last_name: tgUser?.last_name || '',
                username: tgUser?.username || null,
                role: 'admin',
                approval_status: 'approved'
            }, { onConflict: 'telegram_id' })

            if (upsertError) {
                alert('خطأ في حفظ بيانات الأدمن: ' + upsertError.message)
                setLoading(false)
                return
            }

            // محاولة التنقل عبر navigate أولاً
            try {
                navigate('/admin', { replace: true })
            } catch (navError) {
                // إذا فشل navigate، نلجأ إلى href
                console.warn('Navigate failed, using href')
                window.location.href = '/admin'
            }
        } catch (e: any) {
            alert('حدث خطأ غير متوقع: ' + (e.message || e))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-gray-900 p-6">
            <div className="flex-1 flex flex-col justify-center">
                <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('role.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">{t('role.subtitle')}</p>

                <div className="space-y-4">
                    <button onClick={() => navigate('/signup/customer')} className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center"><User className="w-8 h-8 text-blue-600 dark:text-blue-400" /></div>
                        <div className="flex-1 text-left"><h2 className="text-xl font-semibold dark:text-white">{t('role.customer_title')}</h2><p className="text-gray-500 dark:text-gray-400 text-sm">{t('role.customer_desc')}</p></div>
                    </button>
                    <button onClick={() => navigate('/signup/driver')} className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center"><Car className="w-8 h-8 text-green-600 dark:text-green-400" /></div>
                        <div className="flex-1 text-left"><h2 className="text-xl font-semibold dark:text-white">{t('role.driver_title')}</h2><p className="text-gray-500 dark:text-gray-400 text-sm">{t('role.driver_desc')}</p></div>
                    </button>

                    {/* قسم الأدمن دائم */}
                    <div className="p-4 border-2 border-purple-200 dark:border-purple-800 rounded-2xl bg-purple-50 dark:bg-purple-900/20">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-6 h-6 text-purple-600" />
                            <span className="font-semibold text-purple-800 dark:text-purple-200">دخول الأدمن</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                placeholder="معرف تيليجرام"
                                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-purple-300 dark:border-purple-600 text-sm"
                            />
                            <button
                                onClick={() => handleAdminLogin(manualId)}
                                disabled={!manualId || loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                            >
                                دخول
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
