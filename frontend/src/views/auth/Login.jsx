import { useState } from 'react'
import './Login.css'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!email || !password) {
      setError('Informe e-mail e senha para continuar.')
      return
    }

    setError('')
    const loginOk = onLogin()

    if (!loginOk) {
      setError('Token JWT nao encontrado no navegador. Salve o token na chave "token".')
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="login-badge">Clinica Escola PUC</p>
        <h1 className="login-title">Acesso ao Sistema</h1>
        <p className="login-subtitle">Entre com sua conta para abrir o painel.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            className="login-input"
            type="email"
            autoComplete="email"
            placeholder="nome@pucminas.br"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="login-label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            className="login-input"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && <p className="login-error">{error}</p>}

          <button className="login-button" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login
