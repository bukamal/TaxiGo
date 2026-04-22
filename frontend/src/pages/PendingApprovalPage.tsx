import { Clock } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function PendingApprovalPage() {
    const { t } = useLanguage()
    return (
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-gray-900">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6"><Clock className="w-10 h-10 text-yellow-600 dark:text-yellow-400" /></div>
            <h1 className="text-2xl font-bold mb-2 dark:text-white">{t('pending.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm">{t('pending.message')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-8">{t('pending.wait_time')}</p>
        </div>
    )
}
