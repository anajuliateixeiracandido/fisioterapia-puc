import { Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import Layout from '../../components/Layout'
import useCadastroAlunoViewModel from '../../viewmodels/useCadastroAlunoViewModel'
import './CadastroAluno.css'

function CadastroAluno() {
const {
  nomeCompleto, setNomeCompleto,
  email, setEmail,
  senha, setSenha,
  confirmarSenha, setConfirmarSenha,
  matricula, setMatricula,
  professorSelecionado, setProfessorSelecionado,
  professores,
  carregandoProfessores,
  mostrarSenha, setMostrarSenha,
  mostrarConfirmarSenha, setMostrarConfirmarSenha,
  carregando,
  erro,
  sucesso,
  handleSubmit,
  cadastrarNovo,
  voltar,
} = useCadastroAlunoViewModel()

if (sucesso) {
  return (
    <Layout>
      <div className="content-section">
        <div className="cadastro-sucesso">
          <CheckCircle size={48} color="#22c55e" />
          <h1 className="cadastro-sucesso-titulo">Aluno cadastrado</h1>
          <p className="cadastro-sucesso-descricao">
            O aluno foi cadastrado com sucesso no sistema.
          </p>
          <div className="cadastro-sucesso-acoes">
            <button type="button" className="btn-cadastro-primary" onClick={cadastrarNovo}>
              Cadastrar outro aluno
            </button>
            <button type="button" className="btn-cadastro-secondary" onClick={voltar}>
              Voltar para o início
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
          <h1 className="cadastro-titulo">Cadastrar aluno</h1>
          <p className="cadastro-subtitulo">Preencha os dados do novo aluno</p>
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
              placeholder="Nome completo do aluno"
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
              placeholder="aluno@sga.pucminas.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={carregando}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Matrícula <span className="campo-obrigatorio">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Entre 5 e 10 dígitos"
              value={matricula}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '')
                if (valor.length <= 10) setMatricula(valor)
              }}
              disabled={carregando}
              minLength={5}
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Professor responsável <span className="campo-obrigatorio">*</span>
            </label>
            <select
              className="form-input"
              value={professorSelecionado}
              onChange={(e) => setProfessorSelecionado(e.target.value)}
              disabled={carregando || carregandoProfessores}
            >
              <option value="">
                {carregandoProfessores
                  ? 'Carregando professores...'
                  : 'Selecione um professor'}
              </option>
              {professores.map((prof) => (
                <option key={prof.id} value={prof.codigoPessoa}>
                  {prof.fisioterapeuta.nomeCompleto}
                  {prof.codigoPessoa ? ` — ${prof.codigoPessoa}` : ''}
                </option>
              ))}
            </select>
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
            {carregando ? 'Cadastrando...' : 'Cadastrar aluno'}
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

export default CadastroAluno