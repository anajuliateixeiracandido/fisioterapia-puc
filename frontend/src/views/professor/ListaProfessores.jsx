import { ChevronLeft, ChevronRight, Mail, UserPlus, Users } from 'lucide-react'
import Layout from '../../components/Layout'
import useListaProfessoresViewModel from '../../viewmodels/useListaProfessoresViewModel'
import './ListaProfessores.css'

function Paginacao({ pagination, onMudarPagina }) {
if (!pagination || pagination.totalPages <= 1) return null

return (
  <div className="professores-paginacao">
    <span className="professores-paginacao__info">
      Pagina {pagination.page} de {pagination.totalPages}
    </span>
    <div className="professores-paginacao__botoes">
      <button
        type="button"
        className="professores-paginacao__btn"
        onClick={() => onMudarPagina(pagination.page - 1)}
        disabled={pagination.page <= 1}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        className="professores-paginacao__btn"
        onClick={() => onMudarPagina(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
)
}

function ListaProfessores() {
const { professores, pagination, carregando, erro, mudarPagina } = useListaProfessoresViewModel()

return (
  <Layout>
    <div className="content-section">
      <div className="professores-page">
        <div className="professores-header">
          <div>
            <h1 className="professores-title">Professores</h1>
            <p className="professores-subtitle">Todos os professores cadastrados</p>
          </div>
        </div>

        {!carregando && !erro && (
          <p className="professores-counter">
            {pagination.total} professor(es) encontrado(s)
          </p>
        )}

        {carregando && (
          <div className="professores-state">
            <div className="professores-spinner" />
            <p>Carregando professores...</p>
          </div>
        )}

        {erro && (
          <div className="professores-state professores-state--error">
            <p>{erro}</p>
          </div>
        )}

        {!carregando && !erro && professores.length === 0 && (
          <div className="professores-state">
            <UserPlus size={42} />
            <p>Nenhum professor encontrado.</p>
          </div>
        )}

        {!carregando && !erro && professores.length > 0 && (
          <div className="professores-table-wrapper">
            <table className="professores-table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>E-mail</th>
                  <th>Departamento</th>
                  <th>Total de alunos</th>
                </tr>
              </thead>
              <tbody>
                {professores.map((professor) => (
                  <tr key={professor.id}>
                    <td>
                      <div className="professores-name-cell">
                        <span className="professores-avatar">
                          <UserPlus size={18} />
                        </span>
                        <span className="professores-name">
                          {professor.fisioterapeuta?.nomeCompleto ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="professores-email">
                        <Mail size={16} />
                        {professor.fisioterapeuta?.email ?? '-'}
                      </span>
                    </td>
                    <td className="professores-muted">{professor.departamento ?? '-'}</td>
                    <td>
                      <span className="professores-badge">
                        <Users size={14} />
                        {professor.totalAlunos ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
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

export default ListaProfessores
