import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../context/TelegramContext'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { CheckCircle, XCircle, User, Car, Eye, Users, FileText, Activity } from 'lucide-react'
import { useState } from 'react'

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

    const userId = tgUser?.id?.toString() || ''

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createSupabaseClient(userId)
            const { data } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'admin_telegram_id')
                .single()

            const adminId = data?.value?.replace(/"/g, '')
            if (adminId === userId) {
                setAuthorized(true)
            } else {
                navigate('/')
            }
            setChecking(false)
        }
        if (userId) checkAuth()
        else navigate('/')
    }, [userId])

    if (checking) return <div className="p-6">جاري التحقق من الصلاحية...</div>
    if (!authorized) return null

    const supabase = createSupabaseClient(userId)

    const fetchData = async () => {
        if (!userId) return
        if (activeTab === 'pending') {
            const { data } = await supabase.rpc('get_pending_users', { _admin_telegram_id: userId })
            setPending(data || [])
        } else if (activeTab === 'users') {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
            setUsers(data || [])
        } else if (activeTab === 'rides') {
            const { data } = await supabase.from('rides').select('*, customer:profiles!rides_customer_id_fkey(first_name,last_name), driver:profiles!rides_driver_id_fkey(first_name,last_name)').order('created_at', { ascending: false }).limit(50)
            setRides(data || [])
        } else if (activeTab === 'stats') {
            const { data } = await supabase.rpc('get_admin_stats', { _admin_telegram_id: userId })
            setStats(data)
        }
    }

    useEffect(() => { fetchData() }, [activeTab])

    const approve = async (userTelegramId: string, status: boolean) => {
        await supabase.rpc('approve_user', { _admin_telegram_id: userId, _user_telegram_id: userTelegramId, _status: status ? 'approved' : 'rejected' })
        fetchData()
        setSelected(null)
    }

    const viewDetails = async (user: any) => {
        setSelected(user)
        if (user.role === 'driver') {
            const { data } = await supabase.rpc('get_driver_details_for_admin', { _admin_telegram_id: userId, _profile_id: user.id })
            if (data) setDetails(data[0])
        }
    }

    // ... (باقي واجهة الإدارة كما هي بدون تغيير)
    return (
        <div className="p-4 max-w-4xl mx-auto pb-20">
            <h1 className="text-2xl font-bold mb-4">لوحة الإدارة</h1>
            <p className="text-sm text-gray-500 mb-4">معرف تيليجرام: {userId}</p>
            {/* المحتوى الكامل للإدارة */}
        </div>
    )
}
