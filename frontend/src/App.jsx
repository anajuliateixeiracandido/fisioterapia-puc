// import { useState } from 'react'
// import Login from './views/auth/Login'
// import Home from './views/home/Home'

// function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false)

//   const handleLogin = () => {
//     setIsAuthenticated(true)
//   }

//   return isAuthenticated ? <Home /> : <Login onLogin={handleLogin} />
// }

// export default App


import { useState } from 'react'
import Login from './views/auth/Login'
import Home from './views/home/Home'
import { getToken, TOKEN_STORAGE_KEY } from './utils/utilities'

const getInitialAuthState = () => {
  return Boolean(getToken())
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthState)

  const handleLogin = (token) => {
    const resolvedToken = token ?? getToken()

    if (!resolvedToken) {
      return false
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, resolvedToken)
    setIsAuthenticated(true)
    return true
  }

  const handleLogout = () => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    setIsAuthenticated(false)
  }

  return isAuthenticated ? <Home onLogout={handleLogout} /> : <Login onLogin={handleLogin} />
}

export default App

