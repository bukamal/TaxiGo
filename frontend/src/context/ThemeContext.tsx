import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light'|'dark'
interface ThemeContextType { theme: Theme; toggleTheme: () => void }
const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light')
    useEffect(() => {
        const saved = localStorage.getItem('theme') as Theme
        const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        const initial = saved || system
        setTheme(initial); document.documentElement.classList.toggle('dark', initial==='dark')
    }, [])
    const toggleTheme = () => {
        const newTheme = theme==='light'?'dark':'light'
        setTheme(newTheme); localStorage.setItem('theme', newTheme); document.documentElement.classList.toggle('dark', newTheme==='dark')
        const tg = (window as any).Telegram?.WebApp
        if(tg) { tg.setHeaderColor(newTheme==='dark'?'#1c1c1e':'#ffffff'); tg.setBackgroundColor(newTheme==='dark'?'#1c1c1e':'#ffffff') }
    }
    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}
export const useTheme = () => useContext(ThemeContext)
