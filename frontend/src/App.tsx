import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTelegram } from './context/TelegramContext'
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

function AppContent() {
  const { isReady } = useTelegram()
  const { profile } = useAppStore()
  const [appState, setAppState] = useState<'loading' | 'onboarding' | 'choose_role' | 'signup_customer' | 'signup_driver' | 'pending' | 'approved'>('loading')

  useEffect(() => {
    // حل مؤقت: تجاوز فحص قاعدة البيانات واعتبار المستخدم جديدًا دائمًا
    // هذا يسمح لنا برؤية الواجهة وتجربة التسجيل
    setTimeout(() => {
      setAppState('onboarding');
    }, 500);
  }, [isReady]);

  if (!isReady || appState === 'loading') return <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-lg">تاكسي جو 🚕</p></div>;

  return (
    <BrowserRouter>
      <Routes>
        {appState === 'onboarding' && <><Route path="/onboarding" element={<OnboardingPage />} /><Route path="*" element={<Navigate to="/onboarding" />} /></>}
        {appState === 'choose_role' && <><Route path="/choose-role" element={<RoleSelectionPage />} /><Route path="*" element={<Navigate to="/choose-role" />} /></>}
        {appState === 'signup_customer' && <><Route path="/signup/customer" element={<CustomerSignupPage />} /><Route path="*" element={<Navigate to="/signup/customer" />} /></>}
        {appState === 'signup_driver' && <><Route path="/signup/driver" element={<DriverSignupPage />} /><Route path="*" element={<Navigate to="/signup/driver" />} /></>}
        {appState === 'pending' && <><Route path="/pending" element={<PendingApprovalPage />} /><Route path="*" element={<Navigate to="/pending" />} /></>}
        {appState === 'approved' && (
          <Route path="/" element={<Layout />}>
            <Route index element={profile?.role === 'driver' ? <Navigate to="/driver" /> : <HomePage />} />
            <Route path="ride/:id" element={<RidePage />} />
            <Route path="driver" element={<DriverDashboard />} />
            <Route path="driver/vehicle" element={<DriverVehiclePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" />} />
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
