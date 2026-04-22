import { Outlet } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import BottomNav from './BottomNav'
import LoadingScreen from './LoadingScreen'

export default function Layout() {
    const { isLoading } = useAppStore()
    if (isLoading) return <LoadingScreen />
    return <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900"><main className="flex-1 overflow-y-auto no-scrollbar pb-16"><Outlet /></main><BottomNav /></div>
}
