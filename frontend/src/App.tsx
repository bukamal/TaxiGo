import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'

import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
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

export default function App() {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<LoginPage />} />
                            <Route path="ride/:id" element={<RidePage />} />
                            <Route path="profile" element={<ProfilePage />} />
                        </Route>
                        
                        <Route path="/choose-role" element={<RoleSelectionPage />} />
                        <Route path="/signup/customer" element={<CustomerSignupPage />} />
                        <Route path="/signup/driver" element={<DriverSignupPage />} />
                        <Route path="/pending" element={<PendingApprovalPage />} />
                        <Route path="/driver" element={<DriverDashboard />} />
                        <Route path="/driver/vehicle" element={<DriverVehiclePage />} />
                        <Route path="/admin" element={<AdminPage />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </LanguageProvider>
    )
}
