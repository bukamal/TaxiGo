import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { useEffect, useState } from 'react'

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

// مستخدم وهمي للتجربة السريعة (سيتم استبداله بالبيانات الحقيقية لاحقاً)
const MOCK_USER = {
  id: 'mock-id',
  telegram_id: 123456789,
  first_name: 'مستخدم',
  last_name: 'تجريبي',
  username: 'test',
  phone: '0500000000',
  role: 'customer', // غيّر إلى 'driver' لتجربة وضع السائق
  approval_status: 'approved',
  is_online: true,
  rating: 5.0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

function AppContent() {
  const { profile, setProfile } = useAppStore()
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    // تحميل حالة Onboarding من localStorage
    const seen = localStorage.getItem(ONBOARDING_KEY) === 'true'
    setHasSeenOnboarding(seen)

    // ضبط المستخدم الوهمي للتجربة (إذا لم يكن هناك مستخدم حقيقي)
    if (!profile) {
      setProfile(MOCK_USER)
    }
  }, [])

  // دالة تُستدعى عند انتهاء Onboarding
  const handleOnboardingFinish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setHasSeenOnboarding(true)
  }

  // أثناء تحميل حالة localStorage، لا نعرض شيئًا (جزء من الثانية)
  if (hasSeenOnboarding === null) {
    return null // أو شاشة فارغة، لن يلاحظها المستخدم
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* مسارات عامة متاحة دائمًا */}
        <Route path="/onboarding" element={<OnboardingPage onFinish={handleOnboardingFinish} />} />
        <Route path="/choose-role" element={<RoleSelectionPage />} />
        <Route path="/signup/customer" element={<CustomerSignupPage />} />
        <Route path="/signup/driver" element={<DriverSignupPage />} />
        <Route path="/pending" element={<PendingApprovalPage />} />

        {/* مسارات التطبيق الرئيسية (بعد Onboarding) */}
        <Route path="/" element={<Layout />}>
          <Route index element={
            !hasSeenOnboarding ? <Navigate to="/onboarding" replace /> :
            profile?.approval_status === 'approved' ? (
              profile.role === 'driver' ? <Navigate to="/driver" replace /> : <HomePage />
            ) : (
              <Navigate to="/choose-role" replace />
            )
          } />
          <Route path="ride/:id" element={<RidePage />} />
          <Route path="driver" element={<DriverDashboard />} />
          <Route path="driver/vehicle" element={<DriverVehiclePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>

        {/* أي مسار غير معروف يذهب إلى الجذر */}
        <Route path="*" element={<Navigate to="/" replace />} />
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
