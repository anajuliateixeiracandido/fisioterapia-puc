import { ChevronLeft, ChevronRight, GraduationCap, Mail, Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import useListaAlunosViewModel from '../../viewmodels/useListaAlunosViewModel'
import './ListaAlunos.css'

function obterNomeAluno(aluno) {
return aluno.fisioterapeuta?.nomeCompleto ?? '-'
}

function obterEmailAluno(aluno) {
return aluno.fisioterapeuta?.email ?? '-'
}

// function obterTotalRelatorios(aluno) {
// return aluno.fisioterapeuta?._count?.relatorios ?? 0
// }

function Paginacao({ pagination, onMudarPagina }) {
if (!pagination || pagination.totalPages <= 1) return null

return (
  <div className="alunos-paginacao">
    <span className="alunos-paginacao__info">
      Pagina {pagination.page} de {pagination.totalPages}
    </span>
    <div className="alunos-paginacao__botoes">
      <button
        type="button"
        className="alunos-paginacao__btn"
        onClick={() => onMudarPagina(pagination.page - 1)}
        disabled={pagination.page <= 1}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        className="alunos-paginacao__btn"
        onClick={() => onMudarPagina(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
)
}

function ListaAlunos() {
const navigate = useNavigate()
const {
  alunos,
  professores,
  professorSelecionado,
  setProfessorSelecionado,
  modo,
  setModo,
  busca,
  setBusca,
  pagination,
  carregando,
  carregandoProfessores,
  erro,
  isCoordenador,
  mudarPagina,
} = useListaAlunosViewModel()

return (
  <Layout>
    <div className="content-section">
      <div className="alunos-page">
        <div className="alunos-header">
          <div>
            <h1 className="alunos-title">Alunos</h1>
            <p className="alunos-subtitle">Seus alunos supervisionados</p>
          </div>
          <button
            type="button"
            className="alunos-add-button"
            onClick={() => navigate('/alunos/cadastro')}
          >
            <Plus size={18} />
            Cadastrar Aluno
          </button>
        </div>

        {isCoordenador && (
          <div className="alunos-tabs">
            <button
              type="button"
              className={`alunos-tab ${modo === 'todos' ? 'alunos-tab--active' : ''}`}
              onClick={() => setModo('todos')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`alunos-tab ${modo === 'professor' ? 'alunos-tab--active' : ''}`}
              onClick={() => setModo('professor')}
            >
              Por professor
            </button>
          </div>
        )}

        <div className="alunos-filters">
          <div className="alunos-search">
            <Search size={18} className="alunos-search__icon" />
            <input
              type="text"
              className="alunos-search__input"
              placeholder="Buscar por nome, matricula ou e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {isCoordenador && modo === 'professor' && (
            <select
              className="alunos-professor-select"
              value={professorSelecionado}
              onChange={(e) => setProfessorSelecionado(e.target.value)}
              disabled={carregandoProfessores}
            >
              <option value="">
                {carregandoProfessores ? 'Carregando professores...' : 'Selecione um professor'}
              </option>
              {professores.map((professor) => (
                <option key={professor.fisioterapeutaId} value={professor.fisioterapeutaId}>
                  {professor.codigoPessoa ? `${professor.codigoPessoa} - ` : ''}
                  {professor.fisioterapeuta?.nomeCompleto ?? 'Professor sem nome'}
                </option>
              ))}
            </select>
          )}
        </div>

        {!carregando && !erro && (
          <p className="alunos-counter">
            {pagination.total} aluno(s) encontrado(s)
          </p>
        )}

        {carregando && (
          <div className="alunos-state">
            <div className="alunos-spinner" />
            <p>Carregando alunos...</p>
          </div>
        )}

        {erro && (
          <div className="alunos-state alunos-state--error">
            <p>{erro}</p>
          </div>
        )}

        {!carregando && !erro && alunos.length === 0 && (
          <div className="alunos-state">
            <GraduationCap size={42} />
            <p>Nenhum aluno encontrado.</p>
          </div>
        )}

        {!carregando && !erro && alunos.length > 0 && (
          <div className="alunos-table-wrapper">
            <table className="alunos-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Matricula</th>
                  <th>E-mail</th>
                  {/* <th>Relatorios ativos</th> */}
                </tr>
              </thead>
              <tbody>
                {alunos.map((aluno) => {
                  // const totalRelatorios = obterTotalRelatorios(aluno)
                  return (
                    <tr key={aluno.id}>
                      <td>
                        <div className="alunos-name-cell">
                          <span className="alunos-avatar">
                            <GraduationCap size={18} />
                          </span>
                          <span className="alunos-name">{obterNomeAluno(aluno)}</span>
                        </div>
                      </td>
                      <td className="alunos-muted">{aluno.matricula ?? '-'}</td>
                      <td>
                        <span className="alunos-email">
                          <Mail size={16} />
                          {obterEmailAluno(aluno)}
                        </span>
                      </td>
                      {/* <td>
                        <span className="alunos-badge">
                          {totalRelatorios} relatorio(s)
                        </span>
                      </td> */}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <Paginacao pagination={pagination} onMudarPagina={mudarPagina} />
      </div>
    </div>
  </Layout>
)
}

export default ListaAlunos
