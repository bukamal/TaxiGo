import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from './context/TelegramContext'
import { createSupabaseClient } from './lib/supabaseClient'
import { useLanguage } from './context/LanguageContext'
import { CheckCircle, XCircle, User, Car, Eye, Users, FileText, Activity } from 'lucide-react'

type Tab = 'pending' | 'users' | 'rides' | 'stats'

export default function AdminPage() {
    const { user: tgUser } = useTelegram()
    const { t } = useLanguage()
    const navigate = useNavigate()
    const [authorized, setAuthorized] = useState(false)
    const [checking, setChecking] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('pending')
    const [pending, setPending] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [rides, setRides] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [selected, setSelected] = useState<any>(null)
    const [details, setDetails] = useState<any>(null)

    const loginId = tgUser?.id?.toString() || ''

    useEffect(() => {
        if (!loginId) { navigate('/'); return }
        const checkAuth = async () => {
            const supabase = createSupabaseClient(loginId)
            const { data } = await supabase.from('app_settings').select('value').eq('key', 'admin_telegram_id').single()
            if (data?.value && String(data.value).replace(/"/g, '') === loginId) {
                setAuthorized(true)
            } else {
                navigate('/')
            }
            setChecking(false)
        }
        checkAuth()
    }, [loginId])

    if (checking) return <div className="p-6">جاري التحقق...</div>
    if (!authorized) return null

    const supabase = createSupabaseClient(loginId)

    const fetchData = async () => {
        if (activeTab === 'pending') {
            const { data } = await supabase.rpc('get_pending_users', { _admin_telegram_id: loginId })
            setPending(data || [])
        } else if (activeTab === 'users') {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
            setUsers(data || [])
        } else if (activeTab === 'rides') {
            const { data } = await supabase.from('rides').select('*, customer:profiles!rides_customer_id_fkey(first_name,last_name), driver:profiles!rides_driver_id_fkey(first_name,last_name)').order('created_at', { ascending: false }).limit(50)
            setRides(data || [])
        } else if (activeTab === 'stats') {
            const { data } = await supabase.rpc('get_admin_stats', { _admin_telegram_id: loginId })
            setStats(data)
        }
    }

    useEffect(() => { fetchData() }, [activeTab])

    const approve = async (userTelegramId: string, status: boolean) => {
        await supabase.rpc('approve_user', { _admin_telegram_id: loginId, _user_telegram_id: userTelegramId, _status: status ? 'approved' : 'rejected' })
        fetchData()
        setSelected(null)
    }

    const viewDetails = async (user: any) => {
        setSelected(user)
        if (user.role === 'driver') {
            const { data } = await supabase.rpc('get_driver_details_for_admin', { _admin_telegram_id: loginId, _profile_id: user.id })
            if (data) setDetails(data[0])
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
            <h1 className="text-2xl font-bold mb-4">لوحة الإدارة</h1>
            <p className="text-sm text-gray-500 mb-4">معرف تيليجرام: {loginId}</p>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id as Tab); setSelected(null) }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                        <tab.icon className="w-4 h-4" />{tab.label}
                    </button>
                ))}
            </div>

            {selected ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <button onClick={() => { setSelected(null); setDetails(null) }} className="mb-4 text-brand-600">&larr; {t('admin.back')}</button>
                    <h2 className="text-xl font-bold mb-4 dark:text-white">{selected.first_name} {selected.last_name}</h2>
                    <div className="space-y-2 text-sm">
                        <p>Telegram ID: {selected.telegram_id}</p>
                        <p>Username: @{selected.username || 'N/A'}</p>
                        <p>Phone: {selected.phone}</p>
                        <p>Role: {selected.role}</p>
                        {details && (
                            <>
                                <h3 className="font-medium mt-4">{t('admin.vehicle_license')}</h3>
                                <p>Vehicle: {details.vehicle_make} {details.vehicle_model} ({details.vehicle_year})</p>
                                <p>Plate: {details.vehicle_plate} | Color: {details.vehicle_color}</p>
                                <p>License #: {details.license_number}</p>
                                {details.license_image_url && <img src={details.license_image_url} className="max-h-40 rounded" />}
                                {details.id_card_image_url && <img src={details.id_card_image_url} className="max-h-40 rounded" />}
                            </>
                        )}
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => approve(selected.telegram_id, true)} className="flex-1 bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> {t('admin.approve')}</button>
                        <button onClick={() => approve(selected.telegram_id, false)} className="flex-1 bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"><XCircle className="w-5 h-5" /> {t('admin.reject')}</button>
                    </div>
                </div>
            ) : (
                <>
                    {activeTab === 'pending' && pending.map(u => (
                        <div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl flex justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${u.role === 'driver' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} flex items-center justify-center`}>
                                    {u.role === 'driver' ? <Car className="w-5 h-5 text-green-600" /> : <User className="w-5 h-5 text-blue-600" />}
                                </div>
                                <div><p className="font-medium dark:text-white">{u.first_name} {u.last_name}</p><p className="text-sm text-gray-500">{u.phone}</p></div>
                            </div>
                            <button onClick={() => viewDetails(u)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"><Eye className="w-5 h-5" /></button>
                        </div>
                    ))}
                    {activeTab === 'users' && users.map(u => (
                        <div key={u.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex justify-between text-sm mb-1">
                            <div><span className="font-medium dark:text-white">{u.first_name} {u.last_name}</span><span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{u.role}</span></div>
                            <span className={`text-xs px-2 py-1 rounded ${u.approval_status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : u.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>{u.approval_status}</span>
                        </div>
                    ))}
                    {activeTab === 'rides' && rides.map(r => (
                        <div key={r.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg text-sm mb-1">
                            <div className="flex justify-between"><span>{r.customer?.first_name} → {r.driver?.first_name || 'لا يوجد'}</span><span className="font-medium">${r.fare}</span></div>
                            <div className="text-xs text-gray-500 flex justify-between"><span>{new Date(r.created_at).toLocaleString()}</span><span className={`px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>{r.status}</span></div>
                        </div>
                    ))}
                    {activeTab === 'stats' && stats && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl"><p className="text-gray-500">إجمالي الرحلات</p><p className="text-3xl font-bold">{stats.total_rides}</p></div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl"><p className="text-gray-500">الإيرادات الكلية</p><p className="text-3xl font-bold">${stats.total_revenue}</p></div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl"><p className="text-gray-500">رحلات اليوم</p><p className="text-3xl font-bold">{stats.today_rides}</p></div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl"><p className="text-gray-500">إيرادات اليوم</p><p className="text-3xl font-bold">${stats.today_revenue}</p></div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl"><p className="text-gray-500">سائقين نشطين</p><p className="text-3xl font-bold">{stats.active_drivers}</p></div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl"><p className="text-gray-500">طلبات معلقة</p><p className="text-3xl font-bold">{stats.pending_users}</p></div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
