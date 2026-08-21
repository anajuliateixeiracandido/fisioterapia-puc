import { Eye, EyeOff } from 'lucide-react'
import useLoginViewModel from '../../viewmodels/useLoginViewModel'
import logo from '../../assets/logo-puc.png'
import './Login.css'

function Login() {
const {
  email,
  setEmail,
  senha,
  setSenha,
  mostrarSenha,
  setMostrarSenha,
  erro,
  carregando,
  handleSubmit,
  navegarParaRecuperarSenha,
} = useLoginViewModel()

return (
  <div className="login-container">
    <div className="login-card">
      <div className="login-header">
        <img src={logo} alt="PUC Minas" className="login-logo" />
        <h1 className="login-title">Sistema de Fisioterapia</h1>
        <p className="login-subtitle">Acesse com seu e-mail institucional</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label className="form-label">E-mail institucional</label>
          <input
            type="email"
            className="form-input"
            placeholder="seu.email@pucminas.edu.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={carregando}
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Senha</label>
          <div className="input-wrapper">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              className="form-input"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={carregando}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="input-toggle"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              tabIndex={-1}
            >
              {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {erro && <p className="form-error">{erro}</p>}

        <button type="submit" className="btn-login" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

        <button
          type="button"
          className="forgot-password-link"
          onClick={navegarParaRecuperarSenha}
        >
          Esqueceu sua senha?
        </button>
      </form>
    </div>
  </div>
)
}

export default Login