import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface Props { isOpen:boolean; onClose:()=>void; onSubmit:(r:number, txt:string)=>void; title:string }
export default function RatingModal({ isOpen, onClose, onSubmit, title }: Props) {
    const { t } = useLanguage()
    const [rating, setRating] = useState(0); const [hover, setHover] = useState(0); const [review, setReview] = useState('')
    if(!isOpen) return null
    return <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"><div className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl p-6"><div className="flex justify-between mb-4"><h3 className="text-lg font-bold">{title}</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div><div className="flex justify-center gap-2 mb-4">{[1,2,3,4,5].map(s=><button key={s} onClick={()=>setRating(s)} onMouseEnter={()=>setHover(s)} onMouseLeave={()=>setHover(0)}><Star className={`w-10 h-10 ${s<=(hover||rating)?'fill-yellow-400 text-yellow-400':'text-gray-300'}`}/></button>)}</div><textarea value={review} onChange={e=>setReview(e.target.value)} placeholder={t('ride.review_placeholder')} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl resize-none" rows={3} /><button onClick={()=>{if(rating>0){onSubmit(rating,review);onClose()}}} disabled={rating===0} className="w-full mt-4 bg-brand-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">{t('ride.submit_rating')}</button></div></div>
}
