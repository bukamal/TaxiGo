import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, getLanguage, setLanguage as saveLanguage, Language } from '../i18n/translations'

interface LanguageContextType { language: Language; setLanguage: (l: Language) => void; t: (key: string) => string; dir: 'ltr'|'rtl' }
const LanguageContext = createContext<LanguageContextType>({ language: 'ar', setLanguage: () => {}, t: (k) => k, dir: 'rtl' })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('ar')
    useEffect(() => { setLanguageState(getLanguage()) }, [])
    const setLanguage = (lang: Language) => { saveLanguage(lang); setLanguageState(lang); document.documentElement.dir = lang==='ar'?'rtl':'ltr'; document.documentElement.lang = lang }
    const t = (key: string): string => translations[language]?.[key] || key
    useEffect(() => { document.documentElement.dir = language==='ar'?'rtl':'ltr'; document.documentElement.lang = language }, [language])
    return <LanguageContext.Provider value={{ language, setLanguage, t, dir: language==='ar'?'rtl':'ltr' }}>{children}</LanguageContext.Provider>
}
export const useLanguage = () => useContext(LanguageContext)
