import { useAuth } from '../context/AuthContext'
import { Car, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function AuthPage() {
    const { signInWithTelegram } = useAuth()
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        setLoading(true)
        try {
            await signInWithTelegram()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900">
            <Car className="w-20 h-20 text-brand-600 mb-6" />
            <h1 className="text-3xl font-bold mb-2 dark:text-white">تاكسي جو</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">سجّل دخولك باستخدام تيليجرام</p>
            <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full max-w-sm bg-[#54A9EB] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#3E8EC0] disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                تسجيل الدخول عبر تيليجرام
            </button>
        </div>
    )
}
