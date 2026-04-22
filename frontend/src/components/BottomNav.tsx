import { Link, useLocation } from 'react-router-dom'
import { Home, Car, User } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/utils'

export default function BottomNav() {
    const location = useLocation()
    const { profile } = useAppStore()
    const isActive = (path: string) => location.pathname === path
    const navItems = [
        { path: '/', icon: Home, label: 'الرئيسية' },
        ...(profile?.role==='driver' ? [{ path: '/driver', icon: Car, label: 'السائق' }] : []),
        { path: '/profile', icon: User, label: 'حسابي' },
    ]
    return <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2 z-50"><div className="max-w-lg mx-auto flex justify-around">{navItems.map(item=><Link key={item.path} to={item.path} className={cn('flex flex-col items-center gap-1 p-2 rounded-lg', isActive(item.path)?'text-brand-600':'text-gray-400')}><item.icon className="w-6 h-6" /><span className="text-[10px]">{item.label}</span></Link>)}</div></nav>
}
