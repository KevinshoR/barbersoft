import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  // Timeout generoso: en hosting gratis (Render) el backend se "duerme" tras
  // inactividad y la primera petición puede tardar 30-50s en despertar.
  timeout: 60000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Rutas que MANEJAN su propio error de credenciales (login, registro, Google).
// Cuando el 401 viene de aquí NO redirigimos: es "credenciales inválidas", no
// "sesión expirada". Dejamos que la página muestre su toast/alerta sin recargar.
const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/google/verify',
  '/auth/google/register',
  '/auth/forgot-password',
  '/auth/reset-password',
]

function isAuthEndpoint(url = '') {
  return AUTH_PATHS.some(p => url.includes(p))
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config
    // Reintento automático ante fallos de red / timeout (cold start del backend).
    const esFalloDeRed = !error.response && (error.code === 'ECONNABORTED' || error.message === 'Network Error')
    if (esFalloDeRed && config && !config._reintentado) {
      config._reintentado = true
      await new Promise(r => setTimeout(r, 2000))
      return api(config)
    }

    // Solo redirigimos por sesión expirada cuando la petición NO viene de un
    // formulario de autenticación. Login/registro fallidos se muestran inline.
    const url = config?.url || ''
    if ((error.response?.status === 401 || error.response?.status === 403) && !isAuthEndpoint(url)) {
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
