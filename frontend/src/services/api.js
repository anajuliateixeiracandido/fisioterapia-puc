import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore'

const api = axios.create({
baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
})

api.interceptors.request.use(config => {
const token = getAccessToken()
if (token) {
  config.headers.Authorization = `Bearer ${token}`
}
return config
})

api.interceptors.response.use(
response => response,
async error => {
  const original = error.config

  if (
    error.response?.status === 401 &&
    error.response?.data?.code === 'TOKEN_EXPIRED' &&
    !original._retry
  ) {
    original._retry = true

    try {
      const refreshToken = localStorage.getItem('refreshToken')

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh-token`,
        { refreshToken }
      )

      setAccessToken(data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)

      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch {
      clearAccessToken()
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
  }

  return Promise.reject(error)
}
)

export default api