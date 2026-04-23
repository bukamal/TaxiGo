import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../context/TelegramContext'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { User, Phone, FileText, Camera, ArrowLeft, Loader2, X } from 'lucide-react'

export default function DriverSignupPage() {
    const { user: tgUser } = useTelegram()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState<'license'|'id'|null>(null)
    const [form, setForm] = useState({
        firstName: tgUser?.first_name || '',
        lastName: tgUser?.last_name || '',
        phone: '',
        vehicleMake: '', vehicleModel: '', vehicleYear: '', vehiclePlate: '', vehicleColor: '', licenseNumber: '',
        licenseImageUrl: '', idCardImageUrl: ''
    })
    const [preview, setPreview] = useState<{license:string|null; idCard:string|null}>({license:null, idCard:null})
    const licenseRef = useRef<HTMLInputElement>(null), idRef = useRef<HTMLInputElement>(null)

    const uploadImage = async (file:File, type:'license'|'id'): Promise<string|null> => {
        if(!tgUser) return null
        const supabase = createSupabaseClient(tgUser.id.toString())
        const path = `${tgUser.id}/${type}/${Date.now()}.${file.name.split('.').pop()}`
        setUploading(type)
        const { error } = await supabase.storage.from('documents').upload(path, file)
        if(error) { alert('Upload failed'); setUploading(null); return null }
        const { data:url } = supabase.storage.from('documents').getPublicUrl(path)
        setUploading(null)
        return url.publicUrl
    }

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, type:'license'|'id') => {
        const file = e.target.files?.[0]; if(!file) return
        const reader = new FileReader(); reader.onload = ev => setPreview(p=>({...p, [type]: ev.target?.result as string})); reader.readAsDataURL(file)
        const url = await uploadImage(file, type); if(url) setForm(f=>({...f, [type==='license'?'licenseImageUrl':'idCardImageUrl']: url}))
    }

    const handleSubmit = async (e:React.FormEvent) => {
        e.preventDefault(); if(!tgUser) return; setLoading(true)
        const supabase = createSupabaseClient(tgUser.id.toString())
        const { data: profile, error: profileError } = await supabase.from('profiles').upsert({
            telegram_id: tgUser.id.toString(),
            first_name: form.firstName,
            last_name: form.lastName,
            username: tgUser.username,
            phone: form.phone,
            role: 'driver',
            approval_status: 'pending'
        }, { onConflict: 'telegram_id' }).select('id').single()
        if(profileError) { alert(profileError.message); setLoading(false); return }
        const { error: detailsError } = await supabase.from('driver_details').upsert({
            profile_id: profile.id,
            vehicle_make: form.vehicleMake, vehicle_model: form.vehicleModel, vehicle_year: parseInt(form.vehicleYear)||null,
            vehicle_plate: form.vehiclePlate, vehicle_color: form.vehicleColor, license_number: form.licenseNumber,
            license_image_url: form.licenseImageUrl, id_card_image_url: form.idCardImageUrl
        }, { onConflict: 'profile_id' })
        setLoading(false)
        if(detailsError) alert('Error: ' + detailsError.message)
        else navigate('/pending')
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
            <button onClick={()=>navigate('/choose-role')} className="mb-6"><ArrowLeft className="w-6 h-6 dark:text-white"/></button>
            <h1 className="text-2xl font-bold mb-6 dark:text-white">{t('signup.driver_title')}</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4"><h2 className="font-semibold">{t('signup.personal_info')}</h2>
                    <input placeholder={t('signup.first_name')} value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required />
                    <input placeholder={t('signup.last_name')} value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required />
                    <input placeholder={t('signup.phone')} value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required />
                </div>
                <div className="space-y-4"><h2 className="font-semibold">{t('signup.vehicle_info')}</h2>
                    <div className="grid grid-cols-2 gap-3"><input placeholder={t('signup.vehicle_make')} value={form.vehicleMake} onChange={e=>setForm({...form, vehicleMake:e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required /><input placeholder={t('signup.vehicle_model')} value={form.vehicleModel} onChange={e=>setForm({...form, vehicleModel:e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required /></div>
                    <div className="grid grid-cols-2 gap-3"><input placeholder={t('signup.vehicle_year')} value={form.vehicleYear} onChange={e=>setForm({...form, vehicleYear:e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required /><input placeholder={t('signup.vehicle_color')} value={form.vehicleColor} onChange={e=>setForm({...form, vehicleColor:e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required /></div>
                    <input placeholder={t('signup.vehicle_plate')} value={form.vehiclePlate} onChange={e=>setForm({...form, vehiclePlate:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required />
                </div>
                <div className="space-y-4"><h2 className="font-semibold">{t('signup.documents')}</h2>
                    <input placeholder={t('signup.license_number')} value={form.licenseNumber} onChange={e=>setForm({...form, licenseNumber:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required />
                    <div>{!preview.license ? <div onClick={()=>licenseRef.current?.click()} className="h-40 border-2 border-dashed rounded-xl flex items-center justify-center">{uploading==='license'?<Loader2 className="animate-spin"/>:<><Camera/>{t('signup.upload_hint')}</>}</div> : <div className="relative h-40"><img src={preview.license} className="h-full object-contain"/><button type="button" onClick={()=>{setPreview(p=>({...p, license:null})); setForm(f=>({...f, licenseImageUrl:''}))}} className="absolute top-2 right-2 bg-white rounded-full p-1"><X className="w-4 h-4"/></button></div>}<input type="file" ref={licenseRef} accept="image/*" onChange={e=>handleFile(e,'license')} hidden /></div>
                    <div>{!preview.idCard ? <div onClick={()=>idRef.current?.click()} className="h-40 border-2 border-dashed rounded-xl flex items-center justify-center">{uploading==='id'?<Loader2 className="animate-spin"/>:<><Camera/>{t('signup.upload_hint')}</>}</div> : <div className="relative h-40"><img src={preview.idCard} className="h-full object-contain"/><button type="button" onClick={()=>{setPreview(p=>({...p, idCard:null})); setForm(f=>({...f, idCardImageUrl:''}))}} className="absolute top-2 right-2 bg-white rounded-full p-1"><X className="w-4 h-4"/></button></div>}<input type="file" ref={idRef} accept="image/*" onChange={e=>handleFile(e,'id')} hidden /></div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">{loading && <Loader2 className="animate-spin"/>}{t('signup.submit')}</button>
            </form>
        </div>
    )
}
