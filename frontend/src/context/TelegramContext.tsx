import React, { createContext, useContext, useEffect, useState } from 'react'

interface TelegramUser { id: number; first_name: string; last_name?: string; username?: string }
interface TelegramContextType { tg: any; user: TelegramUser | null; isReady: boolean }
const TelegramContext = createContext<TelegramContextType>({ tg: null, user: null, isReady: false })

export function TelegramProvider({ children }: { children: React.ReactNode }) {
    const [tg, setTg] = useState<any>(null)
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        let attempts = 0
        const maxAttempts = 10

        const tryGetUser = () => {
            const app = (window as any).Telegram?.WebApp
            if (app) {
                console.log('✅ Telegram WebApp found')
                app.ready()
                app.expand()
                setTg(app)

                const userData = app.initDataUnsafe?.user
                if (userData) {
                    console.log('👤 User data:', userData)
                    setUser(userData)
                    setIsReady(true)
                    return
                } else {
                    console.warn('⚠️ WebApp found but no user data yet')
                }
            } else {
                console.warn('⚠️ Telegram WebApp not found')
            }

            attempts++
            if (attempts < maxAttempts) {
                setTimeout(tryGetUser, 500)
            } else {
                console.error('❌ Failed to get Telegram user after max attempts')
                setIsReady(true) // جاهز لكن بدون مستخدم
            }
        }

        tryGetUser()
    }, [])

    return (
        <TelegramContext.Provider value={{ tg, user, isReady }}>
            {children}
        </TelegramContext.Provider>
    )
}

export const useTelegram = () => useContext(TelegramContext)
