import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { CheckCircle, XCircle, User, Car, Eye, Users, FileText, Activity } from 'lucide-react'

type Tab = 'pending'|'users'|'rides'|'stats'
export default function AdminPage() {
    const { user } = useAuth()
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = useState<Tab>('pending')
    const [pending, setPending] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [rides, setRides] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [selected, setSelected] = useState<any>(null)
    const [details, setDetails] = useState<any>(null)

    const fetchData = async () => {
        if(!user) return
        if(activeTab==='pending') { const {data} = await supabase.rpc('get_pending_users'); setPending(data||[]) }
        else if(activeTab==='users') { const {data} = await supabase.from('profiles').select('*').order('created_at', {ascending:false}); setUsers(data||[]) }
        else if(activeTab==='rides') { const {data} = await supabase.from('rides').select('*, customer:profiles!rides_customer_id_fkey(first_name,last_name), driver:profiles!rides_driver_id_fkey(first_name,last_name)').order('created_at', {ascending:false}).limit(50); setRides(data||[]) }
        else if(activeTab==='stats') { const {data} = await supabase.rpc('get_admin_stats'); setStats(data) }
    }
    useEffect(() => { fetchData() }, [activeTab, user])

    const approve = async (profileId:string, status:boolean) => {
        await supabase.rpc('approve_user', {_profile_id: profileId, _status: status?'approved':'rejected'})
        fetchData(); setSelected(null)
    }
    const viewDetails = async (user:any) => { setSelected(user); if(user.role==='driver') { const {data} = await supabase.rpc('get_driver_details_for_admin', {_profile_id: user.id}); if(data) setDetails(data[0]) } }

    return (
        <div className="p-4 max-w-4xl mx-auto pb-20">
            <h1 className="text-2xl font-bold mb-4 dark:text-white">لوحة الإدارة</h1>
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {[{id:'pending', label:t('admin.pending_approvals'), icon:FileText},{id:'users', label:t('admin.all_users'), icon:Users},{id:'rides', label:t('admin.recent_rides'), icon:Car},{id:'stats', label:t('admin.statistics'), icon:Activity}].map(tab=>(
                    <button key={tab.id} onClick={()=>{setActiveTab(tab.id as Tab); setSelected(null)}} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeTab===tab.id?'bg-brand-600 text-white':'bg-gray-100 dark:bg-gray-800'}`}><tab.icon className="w-4 h-4"/>{tab.label}</button>
                ))}
            </div>
            {selected ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                    <button onClick={()=>{setSelected(null); setDetails(null)}} className="mb-4 text-brand-600">{t('admin.back')}</button>
                    <h2 className="text-xl font-bold mb-4">{selected.first_name} {selected.last_name}</h2>
                    <div className="space-y-2 text-sm"><p>ID: {selected.id}</p><p>@ {selected.username}</p><p>{selected.phone}</p><p>{selected.role}</p>{details && <><h3 className="font-medium mt-4">المركبة</h3><p>{details.vehicle_make} {details.vehicle_model} ({details.vehicle_year})</p><p>لوحة: {details.vehicle_plate} | لون: {details.vehicle_color}</p><p>رخصة: {details.license_number}</p>{details.license_image_url && <img src={details.license_image_url} className="max-h-40 rounded"/>}{details.id_card_image_url && <img src={details.id_card_image_url} className="max-h-40 rounded"/>}</>}</div>
                    <div className="flex gap-3 mt-6"><button onClick={()=>approve(selected.id, true)} className="flex-1 bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5"/>{t('admin.approve')}</button><button onClick={()=>approve(selected.id, false)} className="flex-1 bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"><XCircle className="w-5 h-5"/>{t('admin.reject')}</button></div>
                </div>
            ) : (
                <>
                    {activeTab==='pending' && pending.map(u=><div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl flex justify-between mb-2"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full ${u.role==='driver'?'bg-green-100':'bg-blue-100'} flex items-center justify-center`}>{u.role==='driver'?<Car className="w-5 h-5"/>:<User className="w-5 h-5"/>}</div><div><p>{u.first_name} {u.last_name}</p><p className="text-sm text-gray-500">{u.phone}</p></div></div><button onClick={()=>viewDetails(u)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"><Eye className="w-5 h-5"/></button></div>)}
                    {activeTab==='users' && users.map(u=><div key={u.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex justify-between text-sm mb-1"><div><span className="font-medium">{u.first_name} {u.last_name}</span><span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{u.role}</span></div><span className={`text-xs px-2 py-1 rounded ${u.approval_status==='approved'?'bg-green-100 text-green-800':u.approval_status==='pending'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`}>{u.approval_status}</span></div>)}
                    {activeTab==='rides' && rides.map(r=><div key={r.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg text-sm mb-1"><div className="flex justify-between"><span>{r.customer?.first_name} → {r.driver?.first_name||'لا يوجد'}</span><span className="font-medium">${r.fare}</span></div><div className="text-xs text-gray-500 flex justify-between"><span>{new Date(r.created_at).toLocaleString()}</span><span className={`px-2 py-0.5 rounded-full ${r.status==='completed'?'bg-green-100 text-green-800':'bg-blue-100 text-blue-800'}`}>{r.status}</span></div></div>)}
                    {activeTab==='stats' && stats && <div className="grid grid-cols-2 gap-4">{[{label:'إجمالي الرحلات', value:stats.total_rides},{label:'الإيرادات', value:'$'+stats.total_revenue},{label:'رحلات اليوم', value:stats.today_rides},{label:'إيرادات اليوم', value:'$'+stats.today_revenue},{label:'سائقين نشطين', value:stats.active_drivers},{label:'طلبات معلقة', value:stats.pending_users}].map((s,i)=><div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl"><p className="text-gray-500">{s.label}</p><p className="text-3xl font-bold">{s.value}</p></div>)}</div>}
                </>
            )}
        </div>
    )
}
