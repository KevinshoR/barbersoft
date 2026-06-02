import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [barbershop, setBarbershop] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then(res => setBarbershop(res.data.barbershop))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token, barbershopData) => {
    localStorage.setItem('token', token)
    setBarbershop(barbershopData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setBarbershop(null)
  }

  return (
    <AuthContext.Provider value={{ barbershop, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}