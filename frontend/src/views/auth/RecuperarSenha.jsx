import useRecuperarSenhaViewModel from '../../viewmodels/useRecuperarSenhaViewModel'
import logo from '../../assets/logo-puc.png'
import './login.css'

function RecuperarSenha() {
const {
  email,
  setEmail,
  enviado,
  carregando,
  erro,
  handleSubmit,
  voltarParaLogin,
} = useRecuperarSenhaViewModel()

if (enviado) {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="PUC Minas" className="login-logo" />
          <h1 className="login-title">E-mail enviado</h1>
          <p className="login-subtitle">
            Se este e-mail estiver cadastrado, você receberá as instruções em breve.
            Verifique sua caixa de entrada.
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

return (
  <div className="login-container">
    <div className="login-card">
      <div className="login-header">
        <img src={logo} alt="PUC Minas" className="login-logo" />
        <h1 className="login-title">Recuperar senha</h1>
        <p className="login-subtitle">
          Informe seu e-mail institucional para receber o link de redefinição.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label className="form-label">E-mail institucional</label>
          <input
            type="email"
            className="form-input"
            placeholder="seu.email@sga.pucminas.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={carregando}
            autoComplete="email"
          />
        </div>

        {erro && <p className="form-error">{erro}</p>}

        <button type="submit" className="btn-login" disabled={carregando}>
          {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>

        <button type="button" className="forgot-password-link" onClick={voltarParaLogin}>
          ← Voltar para o login
        </button>
      </form>
    </div>
  </div>
)
}

export default RecuperarSenha