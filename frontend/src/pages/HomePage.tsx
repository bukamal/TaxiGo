import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { LatLngTuple, Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { calculateFare } from '../lib/utils'
import haversine from 'haversine-distance'
import { MapPin, Navigation, Car, Loader2 } from 'lucide-react'
import LocationSearch from '../components/LocationSearch'
import { useLanguage } from '../context/LanguageContext'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = new Icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25,41], iconAnchor: [12,41] })
function ChangeView({ center }: { center: LatLngTuple }) { const map = useMap(); map.setView(center, 14); return null }

export default function HomePage() {
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [userLocation, setUserLocation] = useState<LatLngTuple>([24.7136, 46.6753])
    const [pickup, setPickup] = useState('')
    const [dropoff, setDropoff] = useState('')
    const [pickupCoords, setPickupCoords] = useState<LatLngTuple | null>(null)
    const [dropoffCoords, setDropoffCoords] = useState<LatLngTuple | null>(null)
    const [activeRide, setActiveRide] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [searchMode, setSearchMode] = useState<'pickup'|'dropoff'|null>(null)

    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(pos => { const loc: LatLngTuple = [pos.coords.latitude, pos.coords.longitude]; setUserLocation(loc); if(!pickupCoords) { setPickupCoords(loc); setPickup('موقعي الحالي') } })
    }, [])
    useEffect(() => {
        if(!user||!profile) return
        supabase.from('rides').select('*').eq('customer_id', user.id).in('status', ['pending','accepted','picked_up','in_progress']).limit(1).maybeSingle().then(({data}) => data && setActiveRide(data))
        const channel = supabase.channel('rides').on('postgres_changes', { event:'*', schema:'public', table:'rides', filter:`customer_id=eq.${user.id}` }, payload => payload.new && setActiveRide(payload.new)).subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [user, profile])

    const handlePickupSelect = (lat:number, lng:number, addr:string) => { setPickupCoords([lat,lng]); setPickup(addr); setUserLocation([lat,lng]) }
    const handleDropoffSelect = (lat:number, lng:number, addr:string) => { setDropoffCoords([lat,lng]); setDropoff(addr) }

    const handleRequest = async () => {
        if(!user||!pickupCoords||!dropoffCoords) return; setLoading(true)
        const dist = haversine({lat:pickupCoords[0],lng:pickupCoords[1]}, {lat:dropoffCoords[0],lng:dropoffCoords[1]})/1000
        const { data } = await supabase.from('rides').insert({ customer_id:user.id, pickup_lat:pickupCoords[0], pickup_lng:pickupCoords[1], dropoff_lat:dropoffCoords[0], dropoff_lng:dropoffCoords[1], pickup_address:pickup, dropoff_address:dropoff, status:'pending', fare:calculateFare(dist), distance_km:dist }).select().single()
        setLoading(false); if(data) { setActiveRide(data); navigate(`/ride/${data.id}`) }
    }

    if(!profile) return <div className="p-6 flex flex-col items-center justify-center h-full"><Car className="w-16 h-16 text-brand-600 mb-4"/><h2 className="text-xl font-bold mb-2">تاكسي جو</h2><p className="text-gray-500 text-center mb-6">{t('home.register_prompt')}</p><button onClick={()=>navigate('/choose-role')} className="w-full bg-brand-600 text-white py-3 rounded-xl">{t('home.register')}</button></div>

    return (
        <div className="h-full flex flex-col">
            <div className="h-[45%] relative z-0">
                <MapContainer center={userLocation} zoom={14} className="h-full w-full">
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {searchMode==='pickup' && <LocationSearch onSelect={handlePickupSelect} placeholder={t('home.search_pickup')} />}
                    {searchMode==='dropoff' && <LocationSearch onSelect={handleDropoffSelect} placeholder={t('home.search_dropoff')} />}
                    <Marker position={userLocation} icon={DefaultIcon}><Popup>{t('home.you_are_here')}</Popup></Marker>
                    {pickupCoords && <Marker position={pickupCoords} icon={DefaultIcon} />}
                    {dropoffCoords && <Marker position={dropoffCoords} icon={DefaultIcon} />}
                    <ChangeView center={userLocation} />
                </MapContainer>
            </div>
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-t-3xl -mt-6 relative z-10 shadow-lg flex flex-col">
                {activeRide ? (
                    <div className="p-6"><h3 className="text-lg font-bold mb-4">{t('home.active_ride')}</h3><div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-green-500"/><span>{activeRide.pickup_address}</span></div><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-red-500"/><span>{activeRide.dropoff_address}</span></div><div className="flex justify-between"><span>${activeRide.fare}</span><span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-xs">{activeRide.status}</span></div></div><button onClick={()=>navigate(`/ride/${activeRide.id}`)} className="w-full mt-4 bg-brand-600 text-white py-3 rounded-xl">{t('home.view_details')}</button></div>
                ) : (
                    <div className="p-6 space-y-4">
                        <h2 className="text-xl font-bold dark:text-white">{t('home.where_to')}</h2>
                        <div className="space-y-3">
                            <div className="relative"><MapPin className="absolute left-3 top-3 w-5 h-5 text-green-600" /><input type="text" value={pickup} onFocus={()=>setSearchMode('pickup')} onChange={e=>setPickup(e.target.value)} placeholder={t('home.pickup')} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700" /></div>
                            <div className="relative"><Navigation className="absolute left-3 top-3 w-5 h-5 text-red-600" /><input type="text" value={dropoff} onFocus={()=>setSearchMode('dropoff')} onChange={e=>setDropoff(e.target.value)} placeholder={t('home.dropoff')} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700" /></div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex justify-between"><span>{t('home.economy')}</span><span>~${pickupCoords&&dropoffCoords ? calculateFare(haversine({lat:pickupCoords[0],lng:pickupCoords[1]},{lat:dropoffCoords[0],lng:dropoffCoords[1]})/1000) : calculateFare(5)}</span></div>
                        <button onClick={handleRequest} disabled={!pickupCoords||!dropoffCoords||loading} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">{loading && <Loader2 className="w-5 h-5 animate-spin" />}{loading ? t('home.requesting') : t('home.request')}</button>
                    </div>
                )}
            </div>
        </div>
    )
}
