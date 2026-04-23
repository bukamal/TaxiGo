import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { Car, Loader2, LogIn } from 'lucide-react'

export default function LoginPage() {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [userId, setUserId] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async () => {
        if (!userId.trim()) {
            setError('الرجاء إدخال معرف تيليجرام')
            return
        }
        
        setLoading(true)
        setError('')
        
        try {
            const supabase = createSupabaseClient(userId.trim())
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('telegram_id', userId.trim())
                .maybeSingle()

            if (error) throw error

            if (data && data.approval_status === 'approved') {
                // مستخدم موجود ومعتمد
                if (data.role === 'admin') {
                    navigate('/admin', { replace: true })
                } else if (data.role === 'driver') {
                    navigate('/driver', { replace: true })
                } else {
                    navigate('/', { replace: true })
                }
            } else if (data && data.approval_status === 'pending') {
                navigate('/pending', { replace: true })
            } else {
                // مستخدم جديد، تخزين المعرف مؤقتًا للانتقال إلى التسجيل
                sessionStorage.setItem('temp_telegram_id', userId.trim())
                navigate('/choose-role', { replace: true })
            }
        } catch (e: any) {
            setError('فشل الاتصال: ' + (e.message || 'خطأ غير معروف'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Car className="w-16 h-16 text-brand-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold dark:text-white">تاكسي جو</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">أدخل معرف تيليجرام للمتابعة</p>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="معرف تيليجرام (مثال: 123456789)"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center text-lg"
                        inputMode="numeric"
                    />

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading || !userId.trim()}
                        className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                        دخول
                    </button>
                </div>
            </div>
        </div>
    )
}
