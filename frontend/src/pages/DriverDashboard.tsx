import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { MapPin, Clock, Car, Loader2, CheckCircle, Settings } from 'lucide-react'

export default function DriverDashboard() {
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const watchIdRef = useRef<number|null>(null)
    const [isOnline, setIsOnline] = useState(profile?.is_online||false)
    const [availableRides, setAvailableRides] = useState<any[]>([])
    const [activeRide, setActiveRide] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const updateLocation = async (pos: GeolocationPosition) => { if(!user) return; await supabase.from('profiles').update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }).eq('id', user.id) }
    useEffect(() => {
        if(isOnline && user) { if(navigator.geolocation) { watchIdRef.current = navigator.geolocation.watchPosition(updateLocation, ()=> {}, { enableHighAccuracy: true, maximumAge:10000, timeout:5000 }) } }
        else { if(watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); if(user) supabase.from('profiles').update({ latitude:null, longitude:null }).eq('id', user.id) }
        return () => { if(watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current) }
    }, [isOnline, user])

    useEffect(() => {
        if(!user||profile?.role!=='driver') { navigate('/'); return }
        supabase.from('rides').select('*, customer:profiles!rides_customer_id_fkey(first_name,last_name)').eq('status','pending').order('created_at').then(({data})=> setAvailableRides(data||[]))
        const channel = supabase.channel('available-rides').on('postgres_changes', {event:'INSERT', schema:'public', table:'rides'}, payload => { if(payload.new.status==='pending') setAvailableRides(prev=>[payload.new,...prev]) }).on('postgres_changes', {event:'UPDATE', schema:'public', table:'rides'}, payload => { if(payload.new.status!=='pending') setAvailableRides(prev=>prev.filter(r=>r.id!==payload.new.id)) }).subscribe()
        supabase.from('rides').select('*').eq('driver_id',user.id).in('status',['accepted','picked_up','in_progress']).maybeSingle().then(({data})=> data && setActiveRide(data))
        return () => { supabase.removeChannel(channel) }
    }, [user, profile])

    const toggleOnline = async () => { const newStatus = !isOnline; setIsOnline(newStatus); await supabase.from('profiles').update({ is_online:newStatus }).eq('id',user?.id) }
    const acceptRide = async (rideId:string) => { if(activeRide) return; setLoading(true); const { data } = await supabase.from('rides').update({ driver_id:user?.id, status:'accepted' }).eq('id',rideId).select().single(); setLoading(false); if(data) setActiveRide(data) }
    const updateStatus = async (status:string) => { if(!activeRide) return; const { data } = await supabase.from('rides').update({ status }).eq('id',activeRide.id).select().single(); if(data) { if(status==='completed') setActiveRide(null); else setActiveRide(data) } }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm"><div><h2 className="font-bold text-lg">{t('driver.mode')}</h2><p className="text-sm text-gray-500">{isOnline? t('driver.receiving') : t('driver.offline')}</p></div><button onClick={toggleOnline} className={`px-6 py-2 rounded-full font-semibold ${isOnline?'bg-green-500 text-white':'bg-gray-200 dark:bg-gray-700'}`}>{isOnline? t('driver.online'):t('driver.offline')}</button></div>
            <button onClick={()=>navigate('/driver/vehicle')} className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl flex items-center justify-between"><span className="flex items-center gap-2"><Car className="w-5 h-5"/>بيانات المركبة</span><Settings className="w-5 h-5"/></button>
            {activeRide ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 space-y-4"><div className="flex justify-between"><h3>{t('driver.current_ride')}</h3><span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs">{activeRide.status}</span></div><div className="space-y-2"><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-green-600"/><span>{activeRide.pickup_address}</span></div><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-600"/><span>{activeRide.dropoff_address}</span></div></div><div className="flex gap-2">{activeRide.status==='accepted'&&<button onClick={()=>updateStatus('picked_up')} className="flex-1 bg-brand-600 text-white py-3 rounded-xl">{t('driver.picked_up')}</button>}{activeRide.status==='picked_up'&&<button onClick={()=>updateStatus('in_progress')} className="flex-1 bg-brand-600 text-white py-3 rounded-xl">{t('driver.start_ride')}</button>}{activeRide.status==='in_progress'&&<button onClick={()=>updateStatus('completed')} className="flex-1 bg-green-600 text-white py-3 rounded-xl">{t('driver.complete')}</button>}</div></div>
            ) : (
                <>
                    <h3 className="font-bold px-2">{t('driver.available_requests')}</h3>
                    {availableRides.length===0 ? <div className="text-center py-12 text-gray-400"><Car className="w-12 h-12 mx-auto mb-3 opacity-50"/><p>{t('driver.no_requests')}</p></div> : (
                        <div className="space-y-3">{availableRides.map(ride=><div key={ride.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl space-y-3"><div className="flex justify-between"><div><p className="font-medium">{ride.customer?.first_name} {ride.customer?.last_name}</p><div className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3"/><span>{t('driver.just_now')}</span></div></div><span className="font-bold text-brand-600">${ride.fare}</span></div><div className="text-sm"><p>{ride.pickup_address}</p><p className="text-gray-400">→ {ride.dropoff_address}</p></div><button onClick={()=>acceptRide(ride.id)} disabled={loading} className="w-full bg-brand-600 text-white py-2 rounded-xl flex items-center justify-center gap-2">{loading?<Loader2 className="animate-spin"/>:<CheckCircle className="w-4 h-4"/>}{t('driver.accept')}</button></div>)}</div>
                    )}
                </>
            )}
        </div>
    )
}
