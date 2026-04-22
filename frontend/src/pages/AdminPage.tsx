import { useEffect, useState } from 'react'
import { useTelegram } from '../context/TelegramContext'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { CheckCircle, XCircle, User, Car, Eye, Users, FileText, Activity } from 'lucide-react'

interface PendingUser {
    id: string
    telegram_id: number
    first_name: string
    last_name: string
    username: string
    phone: string
    role: string
    created_at: string
}

interface DriverDetails {
    vehicle_make: string
    vehicle_model: string
    vehicle_year: number
    vehicle_plate: string
    vehicle_color: string
    license_number: string
    license_image_url: string
    id_card_image_url: string
}

type Tab = 'pending' | 'users' | 'rides' | 'stats'

export default function AdminPage() {
    const { user: tgUser } = useTelegram()
    const { t } = useLanguage()
    const supabase = createSupabaseClient(tgUser?.id)

    const [activeTab, setActiveTab] = useState<Tab>('pending')
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [allRides, setAllRides] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
    const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(null)

    useEffect(() => {
        if (!tgUser) return
        fetchData()
    }, [tgUser, activeTab])

    const fetchData = async () => {
        if (!tgUser) return
        setLoading(true)

        if (activeTab === 'pending') {
            const { data } = await supabase.rpc('get_pending_users', { _admin_telegram_id: tgUser.id })
            if (data) setPendingUsers(data)
        } else if (activeTab === 'users') {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
            if (data) setAllUsers(data)
        } else if (activeTab === 'rides') {
            const { data } = await supabase.from('rides').select('*, customer:profiles!rides_customer_id_fkey(first_name, last_name), driver:profiles!rides_driver_id_fkey(first_name, last_name)').order('created_at', { ascending: false }).limit(50)
            if (data) setAllRides(data)
        } else if (activeTab === 'stats') {
            const { data } = await supabase.rpc('get_admin_stats', { _admin_telegram_id: tgUser.id })
            if (data) setStats(data)
        }

        setLoading(false)
    }

    const handleApprove = async (userId: number, approve: boolean) => {
        if (!tgUser) return
        const status = approve ? 'approved' : 'rejected'
        const { error } = await supabase.rpc('approve_user', {
            _admin_telegram_id: tgUser.id,
            _user_telegram_id: userId,
            _status: status
        })
        if (error) {
            alert('Error: ' + error.message)
        } else {
            fetchData()
            setSelectedUser(null)
            setDriverDetails(null)
        }
    }

    const viewDriverDetails = async (user: PendingUser) => {
        if (!tgUser) return
        setSelectedUser(user)
        if (user.role === 'driver') {
            const { data } = await supabase.rpc('get_driver_details_for_admin', {
                _admin_telegram_id: tgUser.id,
                _profile_id: user.id
            })
            if (data && data.length > 0) setDriverDetails(data[0])
        }
    }

    const tabs = [
        { id: 'pending', label: t('admin.pending_approvals'), icon: FileText },
        { id: 'users', label: t('admin.all_users'), icon: Users },
        { id: 'rides', label: t('admin.recent_rides'), icon: Car },
        { id: 'stats', label: t('admin.statistics'), icon: Activity },
    ]

    return (
        <div className="p-4 max-w-4xl mx-auto pb-20">
            <h1 className="text-2xl font-bold mb-4 dark:text-white">لوحة الإدارة</h1>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as Tab); setSelectedUser(null) }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {selectedUser ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <button onClick={() => { setSelectedUser(null); setDriverDetails(null) }} className="mb-4 text-brand-600">&larr; {t('admin.back')}</button>
                    <h2 className="text-xl font-bold mb-4 dark:text-white">{selectedUser.first_name} {selectedUser.last_name}</h2>
                    <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Telegram ID:</span> {selectedUser.telegram_id}</p>
                        <p><span className="font-medium">Username:</span> @{selectedUser.username || 'N/A'}</p>
                        <p><span className="font-medium">Phone:</span> {selectedUser.phone}</p>
                        <p><span className="font-medium">Role:</span> {selectedUser.role}</p>
                        {driverDetails && (
                            <>
                                <h3 className="font-medium mt-4">{t('admin.vehicle_license')}</h3>
                                <p>Vehicle: {driverDetails.vehicle_make} {driverDetails.vehicle_model} ({driverDetails.vehicle_year})</p>
                                <p>Plate: {driverDetails.vehicle_plate} | Color: {driverDetails.vehicle_color}</p>
                                <p>License #: {driverDetails.license_number}</p>
                                {driverDetails.license_image_url && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">{t('admin.license_photo')}:</p>
                                        <img src={driverDetails.license_image_url} alt="License" className="max-h-40 rounded-lg" />
                                    </div>
                                )}
                                {driverDetails.id_card_image_url && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">{t('admin.id_photo')}:</p>
                                        <img src={driverDetails.id_card_image_url} alt="ID" className="max-h-40 rounded-lg" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => handleApprove(selectedUser.telegram_id, true)} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" /> {t('admin.approve')}
                        </button>
                        <button onClick={() => handleApprove(selectedUser.telegram_id, false)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                            <XCircle className="w-5 h-5" /> {t('admin.reject')}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {loading && <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>}

                    {!loading && activeTab === 'pending' && (
                        <div className="space-y-3">
                            {pendingUsers.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('admin.no_pending')}</p>
                            ) : (
                                pendingUsers.map(user => (
                                    <div key={user.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full ${user.role === 'driver' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} flex items-center justify-center`}>
                                                {user.role === 'driver' ? <Car className="w-5 h-5 text-green-600 dark:text-green-400" /> : <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                                            </div>
                                            <div>
                                                <p className="font-medium dark:text-white">{user.first_name} {user.last_name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => viewDriverDetails(user)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <Eye className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {!loading && activeTab === 'users' && (
                        <div className="space-y-2">
                            {allUsers.map(user => (
                                <div key={user.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex items-center justify-between text-sm">
                                    <div>
                                        <span className="font-medium dark:text-white">{user.first_name} {user.last_name}</span>
                                        <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{user.role}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        user.approval_status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        user.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {user.approval_status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && activeTab === 'rides' && (
                        <div className="space-y-2">
                            {allRides.map(ride => (
                                <div key={ride.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg text-sm">
                                    <div className="flex justify-between">
                                        <span className="dark:text-white">{ride.customer?.first_name} → {ride.driver?.first_name || 'No driver'}</span>
                                        <span className="font-medium dark:text-white">${ride.fare}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mt-1">
                                        <span>{new Date(ride.created_at).toLocaleString()}</span>
                                        <span className={`px-2 py-0.5 rounded-full ${
                                            ride.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>{ride.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && activeTab === 'stats' && stats && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                                <p className="text-gray-500 dark:text-gray-400">إجمالي الرحلات</p>
                                <p className="text-3xl font-bold dark:text-white">{stats.total_rides}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                                <p className="text-gray-500 dark:text-gray-400">الإيرادات الكلية</p>
                                <p className="text-3xl font-bold dark:text-white">${stats.total_revenue}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                                <p className="text-gray-500 dark:text-gray-400">رحلات اليوم</p>
                                <p className="text-3xl font-bold dark:text-white">{stats.today_rides}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                                <p className="text-gray-500 dark:text-gray-400">إيرادات اليوم</p>
                                <p className="text-3xl font-bold dark:text-white">${stats.today_revenue}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                                <p className="text-gray-500 dark:text-gray-400">سائقين نشطين</p>
                                <p className="text-3xl font-bold dark:text-white">{stats.active_drivers}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                                <p className="text-gray-500 dark:text-gray-400">طلبات معلقة</p>
                                <p className="text-3xl font-bold dark:text-white">{stats.pending_users}</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
