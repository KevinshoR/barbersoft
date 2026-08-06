import axios from 'axios'

const api = axios.create({
  // En producción, define VITE_API_URL en las variables de entorno del hosting
  // (ej. https://tuapi.onrender.com/api). En local, si no existe, usa localhost.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  // Timeout generoso: en hosting gratis (Render) el backend se "duerme" tras
  // inactividad y la primera petición puede tardar 30-50s en despertar.
  timeout: 60000,
})

// Agrega el token automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    // Reintento automático ante fallos de red / timeout (cold start del backend).
    // Solo una vez, para que la primera petición tras despertar no falle en seco.
    const esFalloDeRed = !error.response && (error.code === 'ECONNABORTED' || error.message === 'Network Error')
    if (esFalloDeRed && config && !config._reintentado) {
      config._reintentado = true
      await new Promise(r => setTimeout(r, 2000))
      return api(config)
    }

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