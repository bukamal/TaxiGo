import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTelegram } from './context/TelegramContext'
import { useAppStore } from './store/useAppStore'
import { createSupabaseClient } from './lib/supabaseClient'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeProvider'

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

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY) === 'true'
    setHasSeenOnboarding(seen)
  }, [])

  useEffect(() => {
    // استخدام معرف تيليجرام حقيقي أو معرف وهمي للتجربة
    const effectiveUserId = tgUser?.id || 123456789
    
    if (!isReady) return

    const checkUserStatus = async () => {
      setIsLoading(true)
      const supabase = createSupabaseClient(effectiveUserId)
      
      // محاولة جلب الملف الشخصي
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', effectiveUserId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        setAppState('onboarding')
      } else if (!data) {
        // مستخدم جديد
        setAppState(hasSeenOnboarding ? 'choose_role' : 'onboarding')
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
      setIsLoading(false)
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
    return <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">جاري التحميل...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* مسارات Onboarding والاختيار */}
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
