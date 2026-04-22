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

function AppContent() {
  const { user: tgUser, isReady } = useTelegram()
  const { setProfile, profile, setIsLoading } = useAppStore()
  const [appState, setAppState] = useState<'loading'|'onboarding'|'choose_role'|'signup_customer'|'signup_driver'|'pending'|'approved'>('loading')

  useEffect(() => {
    // استخدام معرف تجريبي إذا لم نكن داخل تيليجرام (للتطوير فقط)
    const effectiveUser = tgUser || { id: 123456789 };
    
    if (!isReady) return;

    const checkUserStatus = async () => {
      setIsLoading(true);
      const supabase = createSupabaseClient(effectiveUser.id);
      
      const { data, error } = await supabase.rpc('get_my_profile', { _telegram_id: effectiveUser.id });
      
      if (error || !data || data.length === 0) {
        setAppState('onboarding');
      } else {
        const userProfile = data[0];
        setProfile(userProfile);
        
        if (userProfile.approval_status === 'approved') {
          setAppState('approved');
        } else if (userProfile.approval_status === 'pending') {
          setAppState('pending');
        } else {
          setAppState('choose_role');
        }
      }
      setIsLoading(false);
    };

    checkUserStatus();
  }, [tgUser, isReady]);

  if (!isReady || appState === 'loading') return <div className="h-screen flex items-center justify-center">جاري التحميل...</div>;

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
