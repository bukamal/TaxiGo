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
    const { user: tgUser, isReady } = useTelegram()
    const { setProfile, profile, setIsLoading } = useAppStore()
    const [appState, setAppState] = useState<'loading' | 'onboarding' | 'choose_role' | 'signup_customer' | 'signup_driver' | 'pending' | 'approved'>('loading')
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        const seen = localStorage.getItem(ONBOARDING_KEY) === 'true'
        setHasSeenOnboarding(seen)
    }, [])

    useEffect(() => {
        if (!isReady) return

        const effectiveUserId = tgUser?.id || 123456789
        console.log('🔄 التحقق من المستخدم:', effectiveUserId)

        const checkUserStatus = async () => {
            setIsLoading(true)
            setErrorMessage(null)
            try {
                const supabase = createSupabaseClient(effectiveUserId)
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('telegram_id', effectiveUserId)
                    .maybeSingle()

                if (error) throw error

                if (!data) {
                    console.log('👤 مستخدم جديد')
                    setAppState(hasSeenOnboarding ? 'choose_role' : 'onboarding')
                } else {
                    console.log('✅ مستخدم موجود:', data)
                    setProfile(data)
                    setAppState(data.approval_status === 'approved' ? 'approved' : data.approval_status === 'pending' ? 'pending' : 'choose_role')
                }
            } catch (e: any) {
                console.error('❌ فشل جلب المستخدم:', e)
                setErrorMessage(e.message || 'فشل الاتصال بقاعدة البيانات')
                // الانتقال إلى onboarding في حال الفشل
                setAppState(hasSeenOnboarding ? 'choose_role' : 'onboarding')
            } finally {
                setIsLoading(false)
            }
        }

        if (hasSeenOnboarding !== null) {
            checkUserStatus()
        }
    }, [tgUser, isReady, hasSeenOnboarding])

    const completeOnboarding = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true')
        setHasSeenOnboarding(true)
        setAppState('choose_role')
    }

    if (!isReady || appState === 'loading' || hasSeenOnboarding === null) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-lg">تاكسي جو 🚕</p>
                {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
            </div>
        )
    }

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
                {appState === 'signup_customer' && <Route path="*" element={<Navigate to="/signup/customer" replace />} />}
                {appState === 'signup_driver' && <Route path="*" element={<Navigate to="/signup/driver" replace />} />}
                {appState === 'pending' && <Route path="*" element={<Navigate to="/pending" replace />} />}

                {appState === 'approved' && (
                    <Route path="/" element={<Layout />}>
                        <Route index element={profile?.role === 'driver' ? <Navigate to="/driver" replace /> : <HomePage />} />
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
