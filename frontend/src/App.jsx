import Landing from './pages/Landing'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import ShopProfile from './pages/ShopProfile'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Appointments from './pages/Appointments'
import Services     from './pages/Services'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'
import Barbers      from './pages/Barbers'
import Hours        from './pages/Hours'
import Reports from './pages/Reports'
import MyCitas   from './pages/MyCitas'
import FindShop  from './pages/FindShop'
import Subscription from './pages/Subscription'
import Settings     from './pages/Settings'
import BookingPage  from './pages/BookingPage'

function PrivateRoute({ children }) {
  const { barbershop, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Cargando...</div>
  return barbershop ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { barbershop, loading } = useAuth()
  if (loading) return null
  return barbershop ? <Navigate to="/dashboard" /> : children
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          }/>
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          }/>
          <Route path="/hours" element={
            <PrivateRoute><Hours /></PrivateRoute>
          }/>
          <Route path="/appointments" element={
            <PrivateRoute><Appointments /></PrivateRoute>
          }/>
          <Route path="/services" element={
            <PrivateRoute><Services /></PrivateRoute>
          }/>
          <Route path="/reservar/:slug/mis-citas" element={<MyCitas />}/>
<Route path="/reservar" element={<FindShop />}/>
          <Route path="/reports" element={
  <PrivateRoute><Reports /></PrivateRoute>
}/>
          <Route path="/barbers" element={
            <PrivateRoute><Barbers /></PrivateRoute>
          }/>
          <Route path="/forgot-password" element={<ForgotPassword />}/>
<Route path="/reset-password"  element={<ResetPassword />}/>
          <Route path="/reservar/:slug/cita"   element={<BookingPage />}/>
          <Route path="/subscription" element={
  <PrivateRoute><Subscription /></PrivateRoute>
}/>
<Route path="/settings" element={
  <PrivateRoute><Settings /></PrivateRoute>
}/>
          <Route path="/reservar/:slug"        element={<ShopProfile />}/>
          <Route path="/" element={<Landing />}/>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}