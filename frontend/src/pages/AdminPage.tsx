import { useTelegram } from '../context/TelegramContext'

export default function AdminPage() {
    const { user: tgUser } = useTelegram()

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">لوحة الإدارة</h1>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <p className="text-lg mb-2">مرحباً بك في لوحة الإدارة</p>
                <p className="text-sm text-gray-500">
                    معرف تيليجرام الخاص بك: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{tgUser?.id || 'غير متوفر'}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    هذه الصفحة للتأكد من وصولك إلى المسار /admin بنجاح.
                </p>
            </div>
        </div>
    )
}
