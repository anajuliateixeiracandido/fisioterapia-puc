import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import useRedefinirSenhaViewModel from '../../viewmodels/useRedefinirSenhaViewModel'
import logo from '../../assets/logo-puc.png'
import './login.css'

function RedefinirSenha() {
const {
  novaSenha,
  setNovaSenha,
  confirmarSenha,
  setConfirmarSenha,
  mostrarSenha,
  setMostrarSenha,
  mostrarConfirmarSenha,
  setMostrarConfirmarSenha,
  carregando,
  erro,
  sucesso,
  token,
  handleSubmit,
  voltarParaLogin,
} = useRedefinirSenhaViewModel()

if (!token) {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="PUC Minas" className="login-logo" />
          <h1 className="login-title">Link inválido</h1>
          <p className="login-subtitle">
            Este link é inválido ou expirou. Solicite um novo link de recuperação.
          </p>
        </div>
        <div className="login-form">
          <button type="button" className="btn-login" onClick={voltarParaLogin}>
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  )
}

if (sucesso) {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <CheckCircle size={48} color="#22c55e" />
          <h1 className="login-title">Senha redefinida</h1>
          <p className="login-subtitle">
            Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes.
          </p>
        </div>
        <div className="login-form">
          <button type="button" className="btn-login" onClick={voltarParaLogin}>
            Ir para o login
          </button>
        </div>
      </div>
    </div>
  )
}

return (
  <div className="login-container">
    <div className="login-card">
      <div className="login-header">
        <img src={logo} alt="PUC Minas" className="login-logo" />
        <h1 className="login-title">Nova senha</h1>
        <p className="login-subtitle">Crie uma nova senha para sua conta.</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label className="form-label">Nova senha</label>
          <div className="input-wrapper">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              className="form-input"
              placeholder="Mínimo 8 caracteres"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              disabled={carregando}
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

        <div className="form-group">
          <label className="form-label">Confirmar nova senha</label>
          <div className="input-wrapper">
            <input
              type={mostrarConfirmarSenha ? 'text' : 'password'}
              className="form-input"
              placeholder="Repita a nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              disabled={carregando}
            />
            <button
              type="button"
              className="input-toggle"
              onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
              tabIndex={-1}
            >
              {mostrarConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <ul className="senha-requisitos">
          <li className={novaSenha.length >= 8 ? 'requisito valido' : 'requisito'}>
            Mínimo 8 caracteres
          </li>
          <li className={/[A-Z]/.test(novaSenha) ? 'requisito valido' : 'requisito'}>
            1 letra maiúscula
          </li>
          <li className={/[0-9]/.test(novaSenha) ? 'requisito valido' : 'requisito'}>
            1 número
          </li>
          <li className={/[^a-zA-Z0-9]/.test(novaSenha) ? 'requisito valido' : 'requisito'}>
            1 caractere especial
          </li>
        </ul>

        {erro && <p className="form-error">{erro}</p>}

        <button type="submit" className="btn-login" disabled={carregando}>
          {carregando ? 'Salvando...' : 'Redefinir senha'}
        </button>

        <button type="button" className="forgot-password-link" onClick={voltarParaLogin}>
          ← Voltar para o login
        </button>
      </form>
    </div>
  </div>
)
}

export default RedefinirSenha