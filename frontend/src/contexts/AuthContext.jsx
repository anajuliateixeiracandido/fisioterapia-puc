import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { setAccessToken, clearAccessToken } from '../services/tokenStore'

const AuthContext = createContext(null)

let refreshPromise = null

function AuthProvider({ children }) {
const [user, setUser] = useState(() => {
  const salvo = localStorage.getItem('user')
  return salvo ? JSON.parse(salvo) : null
})
const [carregando, setCarregando] = useState(true)

useEffect(() => {
  let ativo = true
  const refreshToken = localStorage.getItem('refreshToken')

  if (!refreshToken) {
    if (ativo) setCarregando(false)
    return () => { ativo = false }
  }

  if (!refreshPromise) {
    refreshPromise = api.post('/auth/refresh-token', { refreshToken })
  }

  refreshPromise
    .then(({ data }) => {
      setAccessToken(data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
    })
    .catch(() => {
      clearAccessToken()
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      if (ativo) setUser(null)
    })
    .finally(() => {
      if (ativo) setCarregando(false)
      refreshPromise = null
    })

  return () => { ativo = false }
}, [])

async function login(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha })
  setAccessToken(data.accessToken)
  setUser(data.user)
  localStorage.setItem('refreshToken', data.refreshToken)
  localStorage.setItem('user', JSON.stringify(data.user))
}

async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    clearAccessToken()
    setUser(null)
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }
}

function atualizarUser(novosDados) {
  const atualizado = { ...user, ...novosDados }
  setUser(atualizado)
  localStorage.setItem('user', JSON.stringify(atualizado))
}

return (
  <AuthContext.Provider value={{ user, carregando, login, logout, atualizarUser }}>
    {children}
  </AuthContext.Provider>
)
}

function useAuth() {
return useContext(AuthContext)
}

// eslint-disable-next-line react-refresh/only-export-components
export { AuthProvider, useAuth }
