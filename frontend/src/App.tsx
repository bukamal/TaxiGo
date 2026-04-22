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

// --- وضع التجربة: مستخدم وهمي جاهز ---
const MOCK_USER = {
  id: 'mock-user-id',
  telegram_id: 123456789,
  first_name: 'مستخدم',
  last_name: 'تجريبي',
  username: 'test_user',
  phone: '0500000000',
  role: 'customer', // غيّر إلى 'driver' لتجربة وضع السائق
  approval_status: 'approved',
  is_online: true,
  rating: 5.0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const ONBOARDING_KEY = 'taxigo_onboarding_completed'

function AppContent() {
  const { user: tgUser, isReady } = useTelegram()
  const { setProfile, profile, setIsLoading } = useAppStore()
  const [appState, setAppState] = useState<'loading' | 'onboarding' | 'choose_role' | 'signup_customer' | 'signup_driver' | 'pending' | 'approved'>('loading')
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null)

  // 1. تحميل تفضيل Onboarding
  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY) === 'true'
    setHasSeenOnboarding(seen)
  }, [])

  // 2. محاولة جلب المستخدم الحقيقي (إن وجد) وإلا استخدام MOCK_USER
  useEffect(() => {
    const effectiveUserId = tgUser?.id || 123456789
    console.log('🔄 التحقق من المستخدم:', effectiveUserId)

    if (!isReady) return

    const checkUserStatus = async () => {
      setIsLoading(true)
      try {
        const supabase = createSupabaseClient(effectiveUserId)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', effectiveUserId)
          .maybeSingle()

        if (error || !data) {
          console.warn('⚠️ لم يتم العثور على مستخدم حقيقي، استخدام المستخدم الوهمي.')
          // استخدام المستخدم الوهمي
          setProfile(MOCK_USER)
          setAppState(MOCK_USER.approval_status === 'approved' ? 'approved' : 'choose_role')
        } else {
          console.log('✅ تم العثور على مستخدم حقيقي:', data)
          setProfile(data)
          setAppState(data.approval_status === 'approved' ? 'approved' : data.approval_status === 'pending' ? 'pending' : 'choose_role')
        }
      } catch (e) {
        console.error('❌ فشل الاتصال بـ Supabase، استخدام المستخدم الوهمي:', e)
        setProfile(MOCK_USER)
        setAppState('approved')
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

  // شاشة التحميل
  if (!isReady || appState === 'loading' || hasSeenOnboarding === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg">تاكسي جو 🚕</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* مسارات Onboarding */}
        <Route path="/onboarding" element={<OnboardingPage onFinish={completeOnboarding} />} />
        <Route path="/choose-role" element={<RoleSelectionPage />} />
        <Route path="/signup/customer" element={<CustomerSignupPage />} />
        <Route path="/signup/driver" element={<DriverSignupPage />} />
        <Route path="/pending" element={<PendingApprovalPage />} />

        {/* إعادة توجيه حسب الحالة */}
        {appState === 'onboarding' && <Route path="*" element={<Navigate to="/onboarding" replace />} />}
        {appState === 'choose_role' && <Route path="*" element={<Navigate to="/choose-role" replace />} />}
        {appState === 'signup_customer' && <Route path="*" element={<Navigate to="/signup/customer" replace />} />}
        {appState === 'signup_driver' && <Route path="*" element={<Navigate to="/signup/driver" replace />} />}
        {appState === 'pending' && <Route path="*" element={<Navigate to="/pending" replace />} />}

        {/* المسارات الرئيسية */}
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
