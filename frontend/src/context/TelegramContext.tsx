import React, { createContext, useContext, useEffect, useState } from 'react'

interface TelegramUser { id: number; first_name: string; last_name?: string; username?: string }
interface TelegramContextType { tg: any; user: TelegramUser | null; isReady: boolean }
const TelegramContext = createContext<TelegramContextType>({ tg: null, user: null, isReady: false })

export function TelegramProvider({ children }: { children: React.ReactNode }) {
    const [tg, setTg] = useState<any>(null)
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isReady, setIsReady] = useState(true) // ✅ جاهز دائمًا

    useEffect(() => {
        const app = (window as any).Telegram?.WebApp
        if (app) {
            console.log('✅ Telegram WebApp found')
            app.ready()
            app.expand()
            setTg(app)
            setUser(app.initDataUnsafe?.user)
        } else {
            console.log('⚠️ No Telegram WebApp, running in browser mode')
        }
        // لا نغير isReady - يبقى true
    }, [])

    return (
        <TelegramContext.Provider value={{ tg, user, isReady }}>
            {children}
        </TelegramContext.Provider>
    )
}

export const useTelegram = () => useContext(TelegramContext)
