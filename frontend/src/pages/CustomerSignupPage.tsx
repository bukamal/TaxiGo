import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { User, Phone, ArrowLeft, Loader2 } from 'lucide-react'

export default function CustomerSignupPage() {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const tempId = sessionStorage.getItem('temp_telegram_id') || ''
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tempId) return alert('معرف تيليجرام غير موجود')
        setLoading(true)
        const supabase = createSupabaseClient(tempId)
        const { error } = await supabase.from('profiles').upsert({
            telegram_id: tempId,
            first_name: form.firstName,
            last_name: form.lastName,
            username: null,
            phone: form.phone,
            role: 'customer',
            approval_status: 'pending'
        }, { onConflict: 'telegram_id' })
        setLoading(false)
        if (error) alert('Error: ' + error.message)
        else { sessionStorage.removeItem('temp_telegram_id'); navigate('/pending') }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
            <button onClick={() => navigate('/choose-role')} className="mb-6"><ArrowLeft className="w-6 h-6 dark:text-white" /></button>
            <h1 className="text-2xl font-bold mb-6 dark:text-white">{t('signup.customer_title')}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input placeholder={t('signup.first_name')} value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required />
                <input placeholder={t('signup.last_name')} value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required />
                <input placeholder={t('signup.phone')} value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" required />
                <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-8">{loading && <Loader2 className="w-5 h-5 animate-spin" />}{t('signup.submit')}</button>
            </form>
        </div>
    )
}
