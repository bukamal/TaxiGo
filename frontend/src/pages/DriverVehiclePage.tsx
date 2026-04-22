import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../context/TelegramContext'
import { useAppStore } from '../store/useAppStore'
import { createSupabaseClient } from '../lib/supabaseClient'
import { Save, ArrowLeft } from 'lucide-react'

export default function DriverVehiclePage() {
    const { user: tgUser } = useTelegram()
    const { profile } = useAppStore()
    const navigate = useNavigate()
    const supabase = createSupabaseClient(tgUser?.id)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ vehicle_make:'', vehicle_model:'', vehicle_year:'', vehicle_plate:'', vehicle_color:'' })

    useEffect(() => {
        if(!profile) return
        supabase.from('driver_details').select('vehicle_make,vehicle_model,vehicle_year,vehicle_plate,vehicle_color').eq('profile_id', profile.id).single().then(({data}) => data && setForm(data))
    }, [profile])

    const handleSave = async () => {
        if(!profile) return; setLoading(true)
        await supabase.from('driver_details').update({ ...form, vehicle_year: parseInt(form.vehicle_year)||null }).eq('profile_id', profile.id)
        setLoading(false); navigate('/driver')
    }

    return (
        <div className="p-4">
            <button onClick={()=>navigate('/driver')} className="mb-4 flex items-center gap-2"><ArrowLeft className="w-5 h-5"/> رجوع</button>
            <h1 className="text-2xl font-bold mb-6 dark:text-white">بيانات المركبة</h1>
            <div className="space-y-4">
                <input value={form.vehicle_make} onChange={e=>setForm({...form, vehicle_make:e.target.value})} placeholder="الشركة المصنعة" className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" />
                <input value={form.vehicle_model} onChange={e=>setForm({...form, vehicle_model:e.target.value})} placeholder="الموديل" className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" />
                <input value={form.vehicle_year} onChange={e=>setForm({...form, vehicle_year:e.target.value})} placeholder="السنة" className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" />
                <input value={form.vehicle_plate} onChange={e=>setForm({...form, vehicle_plate:e.target.value})} placeholder="رقم اللوحة" className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" />
                <input value={form.vehicle_color} onChange={e=>setForm({...form, vehicle_color:e.target.value})} placeholder="اللون" className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" />
                <button onClick={handleSave} disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"><Save className="w-5 h-5"/> حفظ</button>
            </div>
        </div>
    )
}
