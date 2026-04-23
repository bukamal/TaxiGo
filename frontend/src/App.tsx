import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTelegram } from './context/TelegramContext'
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
    const [appState, setAppState] = useState<'loading' | 'onboarding' | 'choose_role' | 'approved' | 'pending'>('loading')
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null)

    useEffect(() => {
        console.log('🔍 App: isReady =', isReady, 'tgUser =', tgUser)
        const seen = localStorage.getItem(ONBOARDING_KEY) === 'true'
        setHasSeenOnboarding(seen)
    }, [])

    useEffect(() => {
        if (!isReady) return
        console.log('🔍 App: hasSeenOnboarding =', hasSeenOnboarding)

        // **تجاوز قاعدة البيانات مؤقتاً: الانتقال مباشرة إلى Onboarding أو Choose Role**
        if (!hasSeenOnboarding) {
            setAppState('onboarding')
        } else {
            // إذا كان قد شاهد Onboarding، ننتقل إلى Choose Role (للتجربة)
            setAppState('choose_role')
        }
    }, [isReady, hasSeenOnboarding])

    const completeOnboarding = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true')
        setHasSeenOnboarding(true)
        setAppState('choose_role')
    }

    if (hasSeenOnboarding === null || appState === 'loading') {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-lg">تاكسي جو 🚕 (تحميل...)</p>
            </div>
        )
    }

    console.log('🎯 App: rendering with appState =', appState)

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
                {appState === 'approved' && (
                    <Route path="/" element={<Layout />}>
                        <Route index element={<HomePage />} />
                        <Route path="ride/:id" element={<RidePage />} />
                        <Route path="driver" element={<DriverDashboard />} />
                        <Route path="driver/vehicle" element={<DriverVehiclePage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="admin" element={<AdminPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                )}
                {appState === 'pending' && <Route path="*" element={<Navigate to="/pending" replace />} />}
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
