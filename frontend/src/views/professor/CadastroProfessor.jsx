import { Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import Layout from '../../components/Layout'
import useCadastroProfessorViewModel from '../../viewmodels/useCadastroProfessorViewModel'
import './CadastroProfessor.css'

function CadastroProfessor() {
const {
  nomeCompleto, setNomeCompleto,
  email, setEmail,
  senha, setSenha,
  confirmarSenha, setConfirmarSenha,
  codigoPessoa, setCodigoPessoa,
  mostrarSenha, setMostrarSenha,
  mostrarConfirmarSenha, setMostrarConfirmarSenha,
  carregando,
  erro,
  sucesso,
  handleSubmit,
  cadastrarNovo,
  voltar,
} = useCadastroProfessorViewModel()

if (sucesso) {
  return (
    <Layout>
      <div className="content-section">
        <div className="cadastro-sucesso">
          <CheckCircle size={48} color="#22c55e" />
          <h1 className="cadastro-sucesso-titulo">Professor cadastrado</h1>
          <p className="cadastro-sucesso-descricao">
            O professor foi cadastrado com sucesso no sistema.
          </p>
          <div className="cadastro-sucesso-acoes">
            <button type="button" className="btn-cadastro-primary" onClick={cadastrarNovo}>
              Cadastrar outro professor
            </button>
            <button type="button" className="btn-cadastro-secondary" onClick={voltar}>
              Voltar para professores
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

return (
  <Layout>
    <div className="content-section">

      <div className="cadastro-page-header">
        <button type="button" className="cadastro-voltar" onClick={voltar}>
          <ArrowLeft size={16} />
          Voltar
        </button>
        <div>
          <h1 className="cadastro-titulo">Cadastrar professor</h1>
          <p className="cadastro-subtitulo">Preencha os dados do novo professor</p>
        </div>
      </div>

      <div className="cadastro-divisor" />

      <form onSubmit={handleSubmit} className="cadastro-form">
        <p className="form-legenda">
          Campos marcados com <span className="campo-obrigatorio">*</span> são obrigatórios
        </p>

        <div className="cadastro-grid">
          <div className="form-group">
            <label className="form-label">
              Nome completo <span className="campo-obrigatorio">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Nome completo do professor"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              disabled={carregando}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              E-mail institucional <span className="campo-obrigatorio">*</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="professor@sga.pucminas.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={carregando}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Código pessoa <span className="campo-obrigatorio">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Entre 5 e 10 dígitos"
              value={codigoPessoa}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '')
                if (valor.length <= 10) setCodigoPessoa(valor)
              }}
              disabled={carregando}
              minLength={5}
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Senha <span className="campo-obrigatorio">*</span>
            </label>
            <div className="input-wrapper">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                className="form-input"
                placeholder="Mínimo 8 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
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
            <label className="form-label">
              Confirmar senha <span className="campo-obrigatorio">*</span>
            </label>
            <div className="input-wrapper">
              <input
                type={mostrarConfirmarSenha ? 'text' : 'password'}
                className="form-input"
                placeholder="Repita a senha"
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
        </div>

        <ul className="senha-requisitos">
          <li className={senha.length >= 8 ? 'requisito valido' : 'requisito'}>
            Mínimo 8 caracteres
          </li>
          <li className={/[A-Z]/.test(senha) ? 'requisito valido' : 'requisito'}>
            1 letra maiúscula
          </li>
          <li className={/[0-9]/.test(senha) ? 'requisito valido' : 'requisito'}>
            1 número
          </li>
          <li className={/[^a-zA-Z0-9]/.test(senha) ? 'requisito valido' : 'requisito'}>
            1 caractere especial
          </li>
        </ul>

        {erro && <p className="form-error">{erro}</p>}

        <div className="cadastro-acoes">
          <button type="submit" className="btn-cadastro-primary" disabled={carregando}>
            {carregando ? 'Cadastrando...' : 'Cadastrar professor'}
          </button>
          <button type="button" className="btn-cadastro-secondary" onClick={voltar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </Layout>
)
}

export default CadastroProfessor
