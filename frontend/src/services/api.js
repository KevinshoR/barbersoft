import axios from 'axios'

const api = axios.create({
  // En producción, define VITE_API_URL en las variables de entorno del hosting
  // (ej. https://tuapi.onrender.com/api). En local, si no existe, usa localhost.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
})

// Agrega el token automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token expiró, manda al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    if (error.response?.status === 402) {
      window.location.href = '/subscription?blocked=true'
    }
    return Promise.reject(error)
  }
)

export default api