import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { User, Car } from 'lucide-react'

export default function RoleSelectionPage() {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const tempId = sessionStorage.getItem('temp_telegram_id') || ''

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-gray-900 p-6">
            <div className="flex-1 flex flex-col justify-center">
                <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('role.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-2">للمعرف: {tempId}</p>
                <div className="space-y-4 mt-8">
                    <button onClick={() => navigate('/signup/customer')} className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center"><User className="w-8 h-8 text-blue-600 dark:text-blue-400" /></div>
                        <div className="flex-1 text-left"><h2 className="text-xl font-semibold dark:text-white">{t('role.customer_title')}</h2><p className="text-gray-500 dark:text-gray-400 text-sm">{t('role.customer_desc')}</p></div>
                    </button>
                    <button onClick={() => navigate('/signup/driver')} className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center"><Car className="w-8 h-8 text-green-600 dark:text-green-400" /></div>
                        <div className="flex-1 text-left"><h2 className="text-xl font-semibold dark:text-white">{t('role.driver_title')}</h2><p className="text-gray-500 dark:text-gray-400 text-sm">{t('role.driver_desc')}</p></div>
                    </button>
                </div>
            </div>
        </div>
    )
}
