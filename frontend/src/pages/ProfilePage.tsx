import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../context/TelegramContext'
import { useAppStore } from '../store/useAppStore'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { User, Star, Car, LogOut, ChevronRight, Moon, Bell, Globe } from 'lucide-react'

export default function ProfilePage() {
    const { user: tgUser } = useTelegram()
    const { profile, setProfile } = useAppStore()
    const navigate = useNavigate()
    const supabase = createSupabaseClient(tgUser?.id)
    const { t, language, setLanguage } = useLanguage()
    const { theme, toggleTheme } = useTheme()
    const [isDriverMode, setIsDriverMode] = useState(profile?.role==='driver')

    const handleLogout = () => { setProfile(null); navigate('/onboarding') }
    const toggleRole = async () => { const newRole = isDriverMode?'customer':'driver'; await supabase.from('profiles').update({ role:newRole }).eq('id',profile?.id); setIsDriverMode(!isDriverMode); setProfile({...profile!, role:newRole}) }

    if(!profile) return <div className="p-6 flex flex-col items-center justify-center h-full"><User className="w-16 h-16 text-gray-300 mb-4"/><p className="text-gray-500 mb-4">{t('profile.register_prompt')}</p><button onClick={()=>navigate('/choose-role')} className="bg-brand-600 text-white px-6 py-3 rounded-xl">{t('home.register')}</button></div>

    return (
        <div className="p-4 space-y-4" dir={language==='ar'?'rtl':'ltr'}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm flex items-center gap-4"><div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-brand-600 text-xl font-bold">{profile.first_name?.[0]}</div><div className="flex-1"><h2 className="font-bold text-lg">{profile.first_name} {profile.last_name}</h2><p className="text-sm text-gray-500">@{profile.username||'no_username'}</p><div className="flex items-center gap-1 mt-1"><Star className="w-4 h-4 fill-yellow-400"/><span>{profile.rating||'5.0'}</span></div></div></div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm divide-y dark:divide-gray-700">
                <div className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><Car className="w-5 h-5"/><span>{t('profile.driver_mode')}</span></div><button onClick={toggleRole} className={`w-12 h-7 rounded-full relative ${isDriverMode?'bg-brand-600':'bg-gray-200'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDriverMode?'left-6':'left-1'}`}/></button></div>
                <button className="w-full p-4 flex items-center justify-between"><div className="flex items-center gap-3"><Bell className="w-5 h-5"/><span>{t('profile.notifications')}</span></div><ChevronRight/></button>
                <button onClick={toggleTheme} className="w-full p-4 flex items-center justify-between"><div className="flex items-center gap-3"><Moon className="w-5 h-5"/><span>{t('profile.dark_mode')}</span></div><div className={`w-12 h-7 rounded-full relative ${theme==='dark'?'bg-brand-600':'bg-gray-200'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme==='dark'?'left-6':'left-1'}`}/></div></button>
                <button onClick={()=>setLanguage(language==='ar'?'en':'ar')} className="w-full p-4 flex items-center justify-between"><div className="flex items-center gap-3"><Globe className="w-5 h-5"/><span>{language==='ar'?'English':'العربية'}</span></div><ChevronRight/></button>
            </div>
            {tgUser && <button onClick={()=>navigate('/admin')} className="w-full bg-gray-100 dark:bg-gray-800 py-4 rounded-2xl font-semibold">{t('profile.admin_panel')}</button>}
            <button onClick={handleLogout} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"><LogOut className="w-5 h-5"/>{t('profile.logout')}</button>
        </div>
    )
}
