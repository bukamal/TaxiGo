import { Car } from 'lucide-react'
export default function LoadingScreen() {
    return <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-gray-900"><div className="relative"><div className="absolute -inset-4 bg-brand-100 dark:bg-brand-900/30 rounded-full animate-pulse" /><Car className="w-12 h-12 text-brand-600 relative z-10" /></div><h1 className="mt-6 text-2xl font-bold">تاكسي جو</h1><p className="mt-2 text-sm text-gray-500">جاري التحميل...</p></div>
}
