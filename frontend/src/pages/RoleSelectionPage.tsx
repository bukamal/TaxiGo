import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../context/TelegramContext'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { User, Car, Shield, AlertCircle } from 'lucide-react'

export default function RoleSelectionPage() {
    const { user: tgUser } = useTelegram()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(false)
    const [manualId, setManualId] = useState('')
    const [showManual, setShowManual] = useState(false)

    const checkAdminStatus = async (userId: string) => {
        if (!userId) return false
        const supabase = createSupabaseClient(userId)
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'admin_telegram_id')
            .maybeSingle()
        
        if (error || !data?.value) return false
        const adminId = String(data.value).replace(/"/g, '')
        return adminId === userId
    }

    useEffect(() => {
        const userId = tgUser?.id?.toString()
        if (!userId) {
            setShowManual(true)
            return
        }

        checkAdminStatus(userId).then(result => {
            setIsAdmin(result)
            if (!result) setShowManual(true)
        })
    }, [tgUser])

    const handleAdminLogin = async (forcedId?: string) => {
        const userId = forcedId || tgUser?.id?.toString()
        if (!userId) return alert('الرجاء إدخال معرف تيليجرام')
        
        setLoading(true)
        const isAdminUser = await checkAdminStatus(userId)
        
        if (!isAdminUser) {
            setLoading(false)
            return alert('❌ هذا المعرف ليس الأدمن!')
        }

        try {
            const supabase = createSupabaseClient(userId)
            await supabase.from('profiles').upsert({
                telegram_id: userId,
                first_name: tgUser?.first_name || 'Admin',
                last_name: tgUser?.last_name || '',
                username: tgUser?.username || null,
                role: 'admin',
                approval_status: 'approved'
            }, { onConflict: 'telegram_id' })
        } catch (e) {
            alert('❌ خطأ في حفظ بيانات الأدمن: ' + e)
            setLoading(false)
            return
        }

        setLoading(false)
        // استخدام navigate (التنقل الداخلي) بدلاً من window.location.href
        navigate('/admin', { replace: true })
    }

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-gray-900 p-6">
            <div className="flex-1 flex flex-col justify-center">
                <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('role.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">{t('role.subtitle')}</p>

                {showManual && (
                    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <span className="font-medium text-yellow-800 dark:text-yellow-200">لم يتم التعرف على حساب تيليجرام</span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                            تأكد من فتح التطبيق من داخل بوت تيليجرام. إذا كنت أدمن، يمكنك إدخال معرفك يدوياً:
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                placeholder="أدخل معرف تيليجرام (رقم)"
                                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-yellow-300 dark:border-yellow-600 text-sm"
                            />
                            <button
                                onClick={() => handleAdminLogin(manualId)}
                                disabled={!manualId || loading}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50"
                            >
                                دخول
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/signup/customer')}
                        className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-4 hover:border-brand-300 transition-colors"
                    >
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                            <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 text-left">
                            <h2 className="text-xl font-semibold dark:text-white">{t('role.customer_title')}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('role.customer_desc')}</p>
                        </div>
                    </button>
                    
                    <button
                        onClick={() => navigate('/signup/driver')}
                        className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-4 hover:border-brand-300 transition-colors"
                    >
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                            <Car className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 text-left">
                            <h2 className="text-xl font-semibold dark:text-white">{t('role.driver_title')}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('role.driver_desc')}</p>
                        </div>
                    </button>

                    {isAdmin && !showManual && (
                        <button
                            onClick={() => handleAdminLogin()}
                            disabled={loading}
                            className="w-full p-6 border-2 border-purple-300 dark:border-purple-700 rounded-2xl flex items-center gap-4 bg-purple-50 dark:bg-purple-900/20 hover:border-purple-500 transition-colors"
                        >
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800/50 rounded-2xl flex items-center justify-center">
                                <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <h2 className="text-xl font-semibold dark:text-white">أنا الأدمن</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">الدخول إلى لوحة التحكم</p>
                            </div>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
