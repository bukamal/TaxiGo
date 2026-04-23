import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../context/TelegramContext'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { User, Car, Shield } from 'lucide-react'

export default function RoleSelectionPage() {
    const { user: tgUser } = useTelegram()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!tgUser?.id) return
        const checkAdmin = async () => {
            const supabase = createSupabaseClient(tgUser.id.toString())
            const { data } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'admin_telegram_id')
                .single()
            
            if (data?.value === tgUser.id.toString()) {
                setIsAdmin(true)
            }
        }
        checkAdmin()
    }, [tgUser])

    const handleAdminLogin = async () => {
        if (!tgUser) return
        setLoading(true)
        const supabase = createSupabaseClient(tgUser.id.toString())
        
        // تأكد من وجود صف الأدمن في profiles
        const { data: existingAdmin } = await supabase
            .from('profiles')
            .select('id')
            .eq('telegram_id', tgUser.id.toString())
            .maybeSingle()
        
        if (!existingAdmin) {
            await supabase.from('profiles').insert({
                telegram_id: tgUser.id.toString(),
                first_name: tgUser.first_name || 'Admin',
                last_name: tgUser.last_name || '',
                username: tgUser.username || null,
                role: 'admin',
                approval_status: 'approved'
            })
        } else {
            await supabase.from('profiles').update({
                role: 'admin',
                approval_status: 'approved'
            }).eq('telegram_id', tgUser.id.toString())
        }
        
        setLoading(false)
        navigate('/admin')
    }

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-gray-900 p-6">
            <div className="flex-1 flex flex-col justify-center">
                <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('role.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">{t('role.subtitle')}</p>
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

                    {isAdmin && (
                        <button
                            onClick={handleAdminLogin}
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
