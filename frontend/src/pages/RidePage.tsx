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

let DefaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
})

const driverIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
})

function ChangeView({ center }: { center: LatLngTuple }) {
    const map = useMap()
    map.setView(center, 14)
    return null
}

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
    const [showRatingModal, setShowRatingModal] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)

    useEffect(() => {
        if (!id || !profile) return

        const fetchRide = async () => {
            const { data } = await supabase
                .from('rides')
                .select('*')
                .eq('id', id)
                .single()

            if (data) {
                setRide(data)
                const otherId = profile.id === data.customer_id ? data.driver_id : data.customer_id
                if (otherId) {
                    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', otherId).single()
                    setOtherUser(profileData)
                    if (profileData?.latitude && profileData?.longitude) {
                        setDriverLocation([profileData.latitude, profileData.longitude])
                    }
                }
            }
        }
        fetchRide()

        const channel = supabase
            .channel(`ride-${id}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${id}` },
                (payload) => {
                    setRide(payload.new)
                    if (payload.new.status === 'completed') {
                        setShowRatingModal(true)
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [id, profile])

    useEffect(() => {
        if (!ride?.driver_id) return

        const driverChannel = supabase
            .channel(`driver-location-${ride.driver_id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${ride.driver_id}`
            }, (payload) => {
                const newLoc = payload.new
                if (newLoc.latitude && newLoc.longitude) {
                    setDriverLocation([newLoc.latitude, newLoc.longitude])
                }
            })
            .subscribe()

        return () => { supabase.removeChannel(driverChannel) }
    }, [ride?.driver_id])

    const handleRatingSubmit = async (rating: number, review: string) => {
        if (!ride) return
        await supabase.from('rides').update({ rating, review }).eq('id', ride.id)
    }

    const handleCancelRide = async (reason: string) => {
        if (!ride) return
        await supabase.from('rides').update({ 
            status: 'cancelled', 
            cancellation_reason: reason 
        }).eq('id', ride.id)
        navigate('/')
    }

    if (!ride) return null

    const center: LatLngTuple = driverLocation || [ride.pickup_lat, ride.pickup_lng]

    return (
        <div className="h-full flex flex-col">
            <div className="absolute top-4 left-4 z-[400]">
                <button onClick={() => navigate('/')} className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
                    <ArrowLeft className="w-5 h-5 dark:text-white" />
                </button>
            </div>

            <div className="h-[40%]">
                <MapContainer center={center} zoom={14} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[ride.pickup_lat, ride.pickup_lng]} icon={DefaultIcon} />
                    <Marker position={[ride.dropoff_lat, ride.dropoff_lng]} icon={DefaultIcon} />
                    {driverLocation && <Marker position={driverLocation} icon={driverIcon} />}
                    <ChangeView center={center} />
                </MapContainer>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-900 rounded-t-3xl -mt-6 relative z-10 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold dark:text-white">رحلة {ride.status}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {ride.id.slice(0, 8)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        ride.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        ride.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                        {ride.status}
                    </span>
                </div>

                {otherUser && (
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            {otherUser.avatar_url ? (
                                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                    {otherUser.first_name?.[0] || '?'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium dark:text-white">{otherUser.first_name} {otherUser.last_name}</p>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{otherUser.rating || '5.0'}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                                <Phone className="w-5 h-5 text-brand-600" />
                            </button>
                            <button className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                                <MessageSquare className="w-5 h-5 text-brand-600" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('ride.pickup')}</p>
                            <p className="font-medium dark:text-white">{ride.pickup_address}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Navigation className="w-5 h-5 text-red-600" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('ride.dropoff')}</p>
                            <p className="font-medium dark:text-white">{ride.dropoff_address}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{t('ride.total_fare')}</span>
                    <span className="text-2xl font-bold dark:text-white">${ride.fare}</span>
                </div>

                {['pending', 'accepted'].includes(ride.status) && (
                    <button 
                        onClick={() => setShowCancelModal(true)} 
                        className="w-full text-red-600 font-medium py-2"
                    >
                        إلغاء الرحلة
                    </button>
                )}
            </div>

            <RatingModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                onSubmit={handleRatingSubmit}
                title={profile?.role === 'customer' ? t('ride.rate_driver') : t('ride.rate_passenger')}
            />

            <CancelRideModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelRide}
            />
        </div>
    )
}
