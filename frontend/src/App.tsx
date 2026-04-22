import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
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

// مستخدم وهمي للسماح بالتجربة السريعة
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
  const { setProfile, profile } = useAppStore()
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY) === 'true'
    setHasSeenOnboarding(seen)
    // ضبط المستخدم الوهمي في المتجر (يمكن استبداله بجلب حقيقي لاحقاً)
    if (!profile) {
      setProfile(MOCK_USER)
    }
  }, [])

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setHasSeenOnboarding(true)
  }

  if (hasSeenOnboarding === null) {
    return <div className="h-screen flex items-center justify-center">جاري التحميل...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage onFinish={completeOnboarding} />} />
        <Route path="/choose-role" element={<RoleSelectionPage />} />
        <Route path="/signup/customer" element={<CustomerSignupPage />} />
        <Route path="/signup/driver" element={<DriverSignupPage />} />
        <Route path="/pending" element={<PendingApprovalPage />} />

        {!hasSeenOnboarding ? (
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        ) : (
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
        <AppContent />
      </ThemeProvider>
    </LanguageProvider>
  )
}
