import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet-geosearch/dist/geosearch.css'
import L from 'leaflet'
import { useLanguage } from '../context/LanguageContext'

let DefaultIcon = L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25,41], iconAnchor: [12,41] })
L.Marker.prototype.options.icon = DefaultIcon

interface Props { onSelect: (lat:number, lng:number, address:string)=>void; placeholder?:string }
export default function LocationSearch({ onSelect, placeholder }: Props) {
    const map = useMap(); const { language } = useLanguage()
    useEffect(() => {
        const provider = new OpenStreetMapProvider({ params: { 'accept-language': language, countrycodes: 'sa' } })
        const control = new (GeoSearchControl as any)({ provider, style:'bar', showMarker:true, autoClose:true, keepResult:true, searchLabel: placeholder|| (language==='ar'?'ابحث عن عنوان...':'Search...') })
        map.addControl(control)
        map.on('geosearch/showlocation', (e:any) => { onSelect(e.location.y, e.location.x, e.location.label) })
        return () => { map.removeControl(control) }
    }, [map, onSelect, placeholder, language])
    return null
}
