import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../context/TelegramContext'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { User, Phone, ArrowLeft, Loader2 } from 'lucide-react'

export default function CustomerSignupPage() {
    const { user: tgUser } = useTelegram()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        firstName: tgUser?.first_name || '',
        lastName: tgUser?.last_name || '',
        phone: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tgUser) return
        setLoading(true)
        const supabase = createSupabaseClient(tgUser.id.toString())
        const { error } = await supabase.from('profiles').upsert({
            telegram_id: tgUser.id.toString(),
            first_name: form.firstName,
            last_name: form.lastName,
            username: tgUser.username,
            phone: form.phone,
            role: 'customer',
            approval_status: 'pending'
        }, { onConflict: 'telegram_id' })
        setLoading(false)
        if (error) alert('Error: ' + error.message)
        else navigate('/pending')
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
            <button onClick={() => navigate('/choose-role')} className="mb-6 p-2 -ml-2"><ArrowLeft className="w-6 h-6 dark:text-white" /></button>
            <h1 className="text-2xl font-bold mb-6 dark:text-white">{t('signup.customer_title')}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">{t('signup.first_name')}</label><div className="relative"><User className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><input type="text" value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700" required /></div></div>
                <div><label className="block text-sm font-medium mb-1">{t('signup.last_name')}</label><div className="relative"><User className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><input type="text" value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700" required /></div></div>
                <div><label className="block text-sm font-medium mb-1">{t('signup.phone')}</label><div className="relative"><Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><input type="tel" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700" required /></div></div>
                <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-8">{loading && <Loader2 className="w-5 h-5 animate-spin" />}{t('signup.submit')}</button>
            </form>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-6">{t('signup.pending_message')}</p>
        </div>
    )
}
