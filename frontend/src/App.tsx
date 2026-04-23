import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTelegram } from './context/TelegramContext'
import { useAppStore } from './store/useAppStore'
import { createSupabaseClient } from './lib/supabaseClient'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'

import Layout from './components/Layout'
import OnboardingPage from './pages/OnboardingPage'
import RoleSelectionPage from './pages/RoleSelectionPage'
import CustomerSignupPage from './pages/CustomerSignupPage'
import DriverSignupPage from './pages/DriverSignupPage'
import PendingApprovalPage from './pages/PendingApprovalPage'
import HomePage from './pages/HomePage'
import DriverDashboard from './pages/DriverDashboard'
import RidePage from './pages/RidePage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import DriverVehiclePage from './pages/DriverVehiclePage'

const ONBOARDING_KEY = 'taxigo_onboarding_completed'

function AppContent() {
    const { user: tgUser } = useTelegram()
    const { setProfile, profile } = useAppStore()
    const [appState, setAppState] = useState<'onboarding' | 'choose_role' | 'approved' | 'pending'>('onboarding')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const seen = localStorage.getItem(ONBOARDING_KEY) === 'true'
        const telegramId = tgUser?.id?.toString()
        console.log('🟢 [App] tgUser:', tgUser, 'telegramId:', telegramId, 'seenOnboarding:', seen)

        if (!telegramId) {
            console.log('🟡 [App] No telegramId, setting appState to', seen ? 'choose_role' : 'onboarding')
            setAppState(seen ? 'choose_role' : 'onboarding')
            setLoading(false)
            return
        }

        const checkUser = async () => {
            console.log('🔵 [App] Checking user with telegramId:', telegramId)
            const supabase = createSupabaseClient(telegramId)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('telegram_id', telegramId)
                .maybeSingle()

            console.log('🟣 [App] Supabase response:', { data, error })

            if (error || !data) {
                console.log('🔴 [App] No user found or error')
                setAppState(seen ? 'choose_role' : 'onboarding')
            } else {
                console.log('🟢 [App] User found:', data)
                setProfile(data)
                if (data.approval_status === 'approved') {
                    console.log('✅ [App] User approved, role:', data.role)
                    setAppState('approved')
                } else if (data.approval_status === 'pending') {
                    console.log('⏳ [App] User pending')
                    setAppState('pending')
                } else {
                    console.log('❓ [App] Unknown status')
                    setAppState('choose_role')
                }
            }
            setLoading(false)
        }

        checkUser()
    }, [tgUser])

    const completeOnboarding = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true')
        setAppState('choose_role')
    }

    if (loading) {
        console.log('⏳ [App] Still loading...')
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-lg">تاكسي جو 🚕 (تحميل...)</p>
            </div>
        )
    }

    console.log('🎯 [App] Rendering with appState =', appState, 'profile:', profile)

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/onboarding" element={<OnboardingPage onFinish={completeOnboarding} />} />
                <Route path="/choose-role" element={<RoleSelectionPage />} />
                <Route path="/signup/customer" element={<CustomerSignupPage />} />
                <Route path="/signup/driver" element={<DriverSignupPage />} />
                <Route path="/pending" element={<PendingApprovalPage />} />

                {appState === 'onboarding' && <Route path="*" element={<Navigate to="/onboarding" replace />} />}
                {appState === 'choose_role' && <Route path="*" element={<Navigate to="/choose-role" replace />} />}
                {appState === 'pending' && <Route path="*" element={<Navigate to="/pending" replace />} />}

                {appState === 'approved' && (
                    <Route path="/" element={<Layout />}>
                        <Route index element={
                            profile?.role === 'admin' ? <Navigate to="/admin" replace /> :
                            profile?.role === 'driver' ? <Navigate to="/driver" replace /> :
                            <HomePage />
                        } />
                        <Route path="ride/:id" element={<RidePage />} />
                        <Route path="driver" element={<DriverDashboard />} />
                        <Route path="driver/vehicle" element={<DriverVehiclePage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="admin" element={<AdminPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                )}
            </Routes>
        </BrowserRouter>
    )
}

export default function App() {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </LanguageProvider>
    )
}
