import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Loader2 } from 'lucide-react'

// تعريف النوع لبيانات تيليجرام
interface TelegramUser {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
    auth_date: number
    hash: string
}

export default function AuthPage() {
    const { session } = useAuth()
    const navigate = useNavigate()
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (session) {
            navigate('/')
            return
        }

        // تحميل سكريبت ويدجت تيليجرام
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-widget.js?22'
        script.async = true
        script.setAttribute('data-telegram-login', 'YOUR_BOT_USERNAME') // استبدل باسم بوتك
        script.setAttribute('data-size', 'large')
        script.setAttribute('data-userpic', 'false')
        script.setAttribute('data-radius', '12')
        script.setAttribute('data-onauth', 'onTelegramAuth(user)')
        script.setAttribute('data-request-access', 'write')

        if (containerRef.current) {
            containerRef.current.innerHTML = ''
            containerRef.current.appendChild(script)
        }

        // تعريف دالة رد النداء العامة
        (window as any).onTelegramAuth = async (user: TelegramUser) => {
            try {
                // استدعاء دالة الحافة للتحقق
                const response = await fetch(
                    'https://<your-project-ref>.supabase.co/functions/v1/telegram-auth',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(user),
                    }
                )

                const data = await response.json()
                if (!response.ok) {
                    throw new Error(data.error || 'Authentication failed')
                }

                // تعيين الجلسة في Supabase
                const { error } = await supabase.auth.setSession({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                })

                if (error) throw error

                // تم تسجيل الدخول بنجاح
                navigate('/')
            } catch (err) {
                console.error(err)
                alert('فشل تسجيل الدخول')
            }
        }

        return () => {
            delete (window as any).onTelegramAuth
        }
    }, [session, navigate])

    if (session) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-3xl font-bold mb-2 dark:text-white">تاكسي جو</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">سجّل دخولك باستخدام تيليجرام</p>
                <div ref={containerRef} className="flex justify-center" />
            </div>
        </div>
    )
}
