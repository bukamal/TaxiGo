import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import OnboardingPage from './pages/OnboardingPage'
import AuthPage from './pages/AuthPage'
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

function AppRoutes() {
    const { user, profile, loading } = useAuth()
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY) === 'true'

    if (loading) {
        return <div className="h-screen flex items-center justify-center">جاري التحميل...</div>
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/choose-role" element={<RoleSelectionPage />} />
                <Route path="/signup/customer" element={<CustomerSignupPage />} />
                <Route path="/signup/driver" element={<DriverSignupPage />} />
                <Route path="/pending" element={<PendingApprovalPage />} />

                <Route path="/" element={<Layout />}>
                    <Route index element={
                        !hasSeenOnboarding ? <Navigate to="/onboarding" replace /> :
                        !user ? <Navigate to="/auth" replace /> :
                        !profile ? <Navigate to="/choose-role" replace /> :
                        profile.approval_status === 'pending' ? <Navigate to="/pending" replace /> :
                        profile.role === 'driver' ? <Navigate to="/driver" replace /> :
                        <HomePage />
                    } />
                    <Route path="ride/:id" element={<RidePage />} />
                    <Route path="driver" element={<DriverDashboard />} />
                    <Route path="driver/vehicle" element={<DriverVehiclePage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="admin" element={<AdminPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default function App() {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </ThemeProvider>
        </LanguageProvider>
    )
}
