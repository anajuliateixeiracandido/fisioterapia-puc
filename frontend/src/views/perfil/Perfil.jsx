import { ArrowLeft, User } from 'lucide-react'
import Layout from '../../components/Layout'
import usePerfilViewModel from '../../viewmodels/usePerfilViewModel'
import './Perfil.css'

function Perfil() {
const {
  perfil,
  nomeCompleto,
  setNomeCompleto,
  carregandoPerfil,
  carregando,
  erro,
  sucesso,
  handleSubmit,
  voltar,
} = usePerfilViewModel()

if (carregandoPerfil) {
  return (
    <Layout>
      <div className="content-section">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Carregando perfil...</p>
        </div>
      </div>
    </Layout>
  )
}

return (
  <Layout>
    <div className="content-section">
      <div className="perfil-page-header">
        <button type="button" className="perfil-voltar" onClick={voltar}>
          <ArrowLeft size={16} />
          Voltar
        </button>
        <div>
          <h1 className="perfil-titulo">Meu perfil</h1>
          <p className="perfil-subtitulo">Gerencie suas informações pessoais</p>
        </div>
      </div>

      <div className="perfil-divisor" />

      <div className="perfil-avatar-section">
        <div className="perfil-avatar">
          <User size={32} color="white" />
        </div>
        <div>
          <p className="perfil-avatar-nome">{perfil?.nomeCompleto}</p>
          <p className="perfil-avatar-role">{perfil?.role}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="perfil-form">
        <div className="perfil-grid">
          <div className="form-group">
            <label className="form-label">Nome completo</label>
            <input
              type="text"
              className="form-input"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-mail institucional</label>
            <input
              type="email"
              className="form-input form-input--bloqueado"
              value={perfil?.email || ''}
              disabled
            />
            <span className="form-hint">O e-mail não pode ser alterado</span>
          </div>

          {perfil?.professor && (
            <div className="form-group">
              <label className="form-label">Código pessoa</label>
              <input
                type="text"
                className="form-input form-input--bloqueado"
                value={perfil.professor.codigoPessoa || '—'}
                disabled
              />
              <span className="form-hint">O código não pode ser alterado</span>
            </div>
          )}

          {perfil?.aluno && (
            <div className="form-group">
              <label className="form-label">Matrícula</label>
              <input
                type="text"
                className="form-input form-input--bloqueado"
                value={perfil.aluno.matricula || '—'}
                disabled
              />
              <span className="form-hint">A matrícula não pode ser alterada</span>
            </div>
          )}

          {perfil?.aluno?.professor && (
            <div className="form-group">
              <label className="form-label">Professor responsável</label>
              <input
                type="text"
                className="form-input form-input--bloqueado"
                value={`${perfil.aluno.professor.fisioterapeuta.nomeCompleto}${perfil.aluno.professor.codigoPessoa ? ` — ${perfil.aluno.professor.codigoPessoa}` : ''}`}
                disabled
              />
            </div>
          )}
        </div>

        {sucesso && <p className="perfil-sucesso">Perfil atualizado com sucesso.</p>}
        {erro && <p className="form-error">{erro}</p>}

        <div className="perfil-acoes">
          <button type="submit" className="btn-perfil-primary" disabled={carregando}>
            {carregando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  </Layout>
)
}

export default Perfil