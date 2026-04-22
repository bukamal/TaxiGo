import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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

// --- إعدادات مؤقتة للتجربة ---
// يمكنك تغيير هذه القيم لتجربة دور مختلف
const MOCK_USER = {
  id: 'test-user-123',
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

// مفتاح تخزين حالة onboarding
const ONBOARDING_KEY = 'taxigo_onboarding_completed'

function AppRoutes() {
  const { setProfile, setIsLoading } = useAppStore()
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    // حقن المستخدم الوهمي في المتجر
    setProfile(MOCK_USER)
    setIsLoading(false)

    // التحقق مما إذا كان المستخدم قد شاهد الـ onboarding مسبقاً
    const seen = localStorage.getItem(ONBOARDING_KEY) === 'true'
    setHasSeenOnboarding(seen)
  }, [])

  // دالة لتمييز أن المستخدم أنهى الـ onboarding
  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setHasSeenOnboarding(true)
  }

  // في حالة التحميل، لا تظهر أي شيء (أو شاشة تحميل بسيطة)
  if (hasSeenOnboarding === null) {
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

        {/* التوجيه إلى Onboarding إذا لم يشاهده بعد */}
        {!hasSeenOnboarding ? (
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        ) : (
          // المسارات الرئيسية بعد Onboarding
          <Route path="/" element={<Layout />}>
            <Route index element={MOCK_USER.role === 'driver' ? <Navigate to="/driver" replace /> : <HomePage />} />
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
        <AppRoutes />
      </ThemeProvider>
    </LanguageProvider>
  )
}
