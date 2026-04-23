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
const ADMIN_ID_KEY = 'taxigo_admin_id'

function AppContent() {
    const { user: tgUser } = useTelegram()
    const { setProfile, profile } = useAppStore()
    const [appState, setAppState] = useState<'onboarding' | 'choose_role' | 'approved' | 'pending'>('choose_role')
    const [loading, setLoading] = useState(false) // ❌ لا يوجد تحميل افتراضي

    useEffect(() => {
        const seen = localStorage.getItem(ONBOARDING_KEY) === 'true'
        const storedAdminId = localStorage.getItem(ADMIN_ID_KEY)
        const telegramId = tgUser?.id?.toString() || storedAdminId

        if (!telegramId) {
            // لا يوجد معرف: انتقل مباشرة إلى choose_role
            setAppState(seen ? 'choose_role' : 'onboarding')
            return
        }

        // محاولة صامتة لجلب بيانات المستخدم
        const checkUser = async () => {
            try {
                const supabase = createSupabaseClient(telegramId)
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('telegram_id', telegramId)
                    .maybeSingle()

                if (error) throw error

                if (!data) {
                    setAppState(seen ? 'choose_role' : 'onboarding')
                } else {
                    setProfile(data)
                    if (data.approval_status === 'approved') {
                        setAppState('approved')
                    } else if (data.approval_status === 'pending') {
                        setAppState('pending')
                    } else {
                        setAppState('choose_role')
                    }
                }
            } catch (e) {
                // فشل صامت: البقاء في choose_role
                setAppState('choose_role')
            }
        }

        checkUser()
    }, [tgUser])

    const completeOnboarding = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true')
        setAppState('choose_role')
    }

    // لا نعرض شاشة تحميل أبدًا
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
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                )}
                <Route path="/admin" element={<AdminPage />} />
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
