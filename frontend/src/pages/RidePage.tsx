import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTelegram } from '../context/TelegramContext'
import { useAppStore } from '../store/useAppStore'
import { createSupabaseClient } from '../lib/supabaseClient'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { LatLngTuple, Icon } from 'leaflet'
import { Phone, MessageSquare, MapPin, Navigation, Star, ArrowLeft } from 'lucide-react'
import RatingModal from '../components/RatingModal'
import CancelRideModal from '../components/CancelRideModal'
import { useLanguage } from '../context/LanguageContext'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = new Icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] })
const driverIcon = new Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] })
function ChangeView({ center }: { center: LatLngTuple }) { const map = useMap(); map.setView(center, 14); return null }

export default function RidePage() {
    const { id } = useParams()
    const { user: tgUser } = useTelegram()
    const { profile } = useAppStore()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const supabase = createSupabaseClient(tgUser?.id)
    const [ride, setRide] = useState<any>(null)
    const [otherUser, setOtherUser] = useState<any>(null)
    const [driverLocation, setDriverLocation] = useState<LatLngTuple | null>(null)
    const [showRating, setShowRating] = useState(false)
    const [showCancel, setShowCancel] = useState(false)

    useEffect(() => {
        if (!id || !profile) return
        supabase.from('rides').select('*').eq('id', id).single().then(({ data }) => {
            if (data) {
                setRide(data)
                const otherId = profile.id === data.customer_id ? data.driver_id : data.customer_id
                if (otherId) supabase.from('profiles').select('*').eq('id', otherId).single().then(({ data: p }) => { setOtherUser(p); if (p?.latitude) setDriverLocation([p.latitude, p.longitude]) })
            }
        })
        const ch = supabase.channel(`ride-${id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${id}` }, payload => { setRide(payload.new); if (payload.new.status === 'completed') setShowRating(true) }).subscribe()
        return () => { supabase.removeChannel(ch) }
    }, [id, profile])

    useEffect(() => {
        if (!ride?.driver_id) return
        const ch = supabase.channel(`driver-${ride.driver_id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${ride.driver_id}` }, payload => { if (payload.new.latitude) setDriverLocation([payload.new.latitude, payload.new.longitude]) }).subscribe()
        return () => { supabase.removeChannel(ch) }
    }, [ride?.driver_id])

    const handleRating = async (rating: number, review: string) => { await supabase.from('rides').update({ rating, review }).eq('id', ride.id) }
    const handleCancel = async (reason: string) => { await supabase.from('rides').update({ status: 'cancelled', cancellation_reason: reason }).eq('id', ride.id); navigate('/') }

    if (!ride) return null
    const center: LatLngTuple = driverLocation || [ride.pickup_lat, ride.pickup_lng]
    return (
        <div className="h-full flex flex-col">
            <div className="absolute top-4 left-4 z-[400]"><button onClick={() => navigate('/')} className="bg-white p-2 rounded-full shadow-lg"><ArrowLeft className="w-5 h-5" /></button></div>
            <div className="h-[40%]"><MapContainer center={center} zoom={14} className="h-full w-full"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[ride.pickup_lat, ride.pickup_lng]} icon={DefaultIcon} /><Marker position={[ride.dropoff_lat, ride.dropoff_lng]} icon={DefaultIcon} />{driverLocation && <Marker position={driverLocation} icon={driverIcon} />}<ChangeView center={center} /></MapContainer></div>
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-t-3xl -mt-6 p-6 space-y-6">
                <div className="flex justify-between"><div><h2>رحلة {ride.status}</h2><p className="text-sm">ID: {ride.id.slice(0, 8)}</p></div><span className={`px-3 py-1 rounded-full text-xs ${ride.status === 'completed' ? 'bg-green-100' : ride.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'}`}>{ride.status}</span></div>
                {otherUser && <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl"><div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold">{otherUser.first_name?.[0]}</div><div className="flex-1"><p className="font-medium">{otherUser.first_name} {otherUser.last_name}</p><div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400" /><span>{otherUser.rating || '5.0'}</span></div></div><div className="flex gap-2"><button className="p-2 bg-white dark:bg-gray-700 rounded-full"><Phone className="w-5 h-5" /></button><button className="p-2 bg-white dark:bg-gray-700 rounded-full"><MessageSquare className="w-5 h-5" /></button></div></div>}
                <div className="space-y-3"><div className="flex gap-3"><MapPin className="w-5 h-5 text-green-600" /><div><p className="text-xs">{t('ride.pickup')}</p><p>{ride.pickup_address}</p></div></div><div className="flex gap-3"><Navigation className="w-5 h-5 text-red-600" /><div><p className="text-xs">{t('ride.dropoff')}</p><p>{ride.dropoff_address}</p></div></div></div>
                <div className="border-t pt-4 flex justify-between"><span>{t('ride.total_fare')}</span><span className="text-2xl font-bold">${ride.fare}</span></div>
                {['pending', 'accepted'].includes(ride.status) && <button onClick={() => setShowCancel(true)} className="text-red-600">إلغاء الرحلة</button>}
            </div>
            <RatingModal isOpen={showRating} onClose={() => setShowRating(false)} onSubmit={handleRating} title={profile?.role === 'customer' ? t('ride.rate_driver') : t('ride.rate_passenger')} />
            <CancelRideModal isOpen={showCancel} onClose={() => setShowCancel(false)} onConfirm={handleCancel} />
        </div>
    )
}
