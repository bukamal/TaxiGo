import React, { createContext, useContext, useEffect, useState } from 'react'

interface TelegramUser {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
}

interface TelegramContextType {
    tg: any
    user: TelegramUser | null
    isReady: boolean
}

const TelegramContext = createContext<TelegramContextType>({
    tg: null,
    user: null,
    isReady: false,
})

export function TelegramProvider({ children }: { children: React.ReactNode }) {
    const [tg, setTg] = useState<any>(null)
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const app = (window as any).Telegram?.WebApp
        if (app) {
            console.log('✅ Telegram WebApp detected')
            app.ready()
            app.expand()
            app.enableClosingConfirmation()
            setTg(app)
            setUser(app.initDataUnsafe?.user)
            setIsReady(true)
        } else {
            // دعم المتصفح العادي: نعتبر التطبيق جاهزاً بدون مستخدم تيليجرام
            console.log('⚠️ Telegram WebApp not detected, using browser mode')
            setIsReady(true)
        }
    }, [])

    return (
        <TelegramContext.Provider value={{ tg, user, isReady }}>
            {children}
        </TelegramContext.Provider>
    )
}

export const useTelegram = () => useContext(TelegramContext)
