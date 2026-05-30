import { useEffect, useMemo, useState } from 'react'
import { Calendar, Eye, Plus, Search, User } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useModal } from '../../contexts/ModalContext'
import { formatarData } from '../../utils/formatadores'
import './Pacientes.css'

function formatarDataParaApi(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function obterDataHoje() {
  return new Date().toISOString().split('T')[0]
}

function dataNascimentoValida(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false

  const [ano, mes, dia] = data.split('-').map(Number)
  const dataNascimento = new Date(ano, mes - 1, dia)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  return (
    ano >= 1900 &&
    dataNascimento.getFullYear() === ano &&
    dataNascimento.getMonth() === mes - 1 &&
    dataNascimento.getDate() === dia &&
    dataNascimento <= hoje
  )
}

function obterProfessor(paciente) {
  return paciente?.professor?.fisioterapeuta?.nomeCompleto || 'Não informado'
}

function ModalNovoPaciente({ aberto, carregando, erro, form, onChange, onClose, onSubmit }) {
  if (!aberto) return null

  const nomeComErro = erro && !form.nomeCompleto.trim()
  const dataComErro = erro && !dataNascimentoValida(form.dataNascimento)

  return (
    <div className="paciente-modal-overlay">
      <div className="paciente-modal" onClick={(e) => e.stopPropagation()}>
        <div className="paciente-modal-header">
          <h2>Novo Paciente</h2>
          <button type="button" className="paciente-modal-close" onClick={onClose}>
            x
          </button>
        </div>

        <form className="paciente-modal-form" onSubmit={onSubmit}>
          <label className={`paciente-field ${nomeComErro ? 'paciente-field--error' : ''}`}>
            <span>
              Nome completo <strong>*</strong>
            </span>
            <input
              type="text"
              placeholder="Nome do paciente"
              value={form.nomeCompleto}
              onChange={(e) => onChange({ nomeCompleto: e.target.value })}
              disabled={carregando}
            />
          </label>

          <label className={`paciente-field ${dataComErro ? 'paciente-field--error' : ''}`}>
            <span>
              Data de nascimento <strong>*</strong>
            </span>
            <input
              type="date"
              value={form.dataNascimento}
              min="1900-01-01"
              max={obterDataHoje()}
              onChange={(e) => {
                const ano = e.target.value.split('-')[0] || ''
                if (ano.length <= 4) onChange({ dataNascimento: e.target.value })
              }}
              disabled={carregando}
            />
          </label>

          <label className="paciente-field">
            <span>Diagnóstico (CID-10)</span>
            <input
              type="text"
              placeholder="Ex: G80 - Paralisia cerebral"
              value={form.condicaoSaude}
              onChange={(e) => onChange({ condicaoSaude: e.target.value })}
              disabled={carregando}
            />
          </label>

          {erro && <p className="paciente-form-error">{erro}</p>}

          <div className="paciente-modal-actions">
            <button type="button" className="paciente-btn paciente-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="paciente-btn paciente-btn-primary" disabled={carregando}>
              {carregando ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ListaPacientes({ onVerDetalhes }) {
  const modal = useModal()
  const { user } = useAuth()
  const [pacientes, setPacientes] = useState([])
  const [busca, setBusca] = useState('')
  const [escopo, setEscopo] = useState('meus')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroCadastro, setErroCadastro] = useState(null)
  const [form, setForm] = useState({
    nomeCompleto: '',
    dataNascimento: '',
    condicaoSaude: '',
  })

  const podeCadastrar = user?.role === 'PROFESSOR'

  const paramsBusca = useMemo(
    () => ({
      page: pagina,
      limit: 10,
      busca: busca.trim() || undefined,
    }),
    [busca, pagina]
  )

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setCarregando(true)
      try {
        const endpoint = escopo === 'todos' ? '/pacientes/todos' : '/pacientes'
        const { data } = await api.get(endpoint, { params: paramsBusca })
        setPacientes(Array.isArray(data.data) ? data.data : [])
        setTotal(data.pagination?.total ?? 0)
        setTotalPaginas(data.pagination?.totalPages ?? 1)
      } catch {
        setPacientes([])
        setTotal(0)
        setTotalPaginas(1)
      } finally {
        setCarregando(false)
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [escopo, paramsBusca])

  function atualizarForm(novosDados) {
    setForm((formAtual) => ({ ...formAtual, ...novosDados }))
  }

  function limparForm() {
    setForm({
      nomeCompleto: '',
      dataNascimento: '',
      condicaoSaude: '',
    })
    setErroCadastro(null)
  }

  async function cadastrarPaciente(e) {
    e.preventDefault()
    setErroCadastro(null)

    if (!form.nomeCompleto.trim() || !form.dataNascimento) {
      setErroCadastro('Preencha os campos obrigatórios.')
      return
    }

    if (!dataNascimentoValida(form.dataNascimento)) {
      setErroCadastro('Informe uma data de nascimento válida.')
      return
    }

    setSalvando(true)

    try {
      await api.post('/pacientes', {
        nomeCompleto: form.nomeCompleto.trim(),
        dataNascimento: formatarDataParaApi(form.dataNascimento),
        condicaoSaude: form.condicaoSaude.trim() || undefined,
      })

      setModalAberto(false)
      limparForm()
      setEscopo('meus')
      setPagina(1)
      const { data } = await api.get('/pacientes', {
        params: { page: 1, limit: 10, busca: busca.trim() || undefined },
      })
      setPacientes(Array.isArray(data.data) ? data.data : [])
      setTotal(data.pagination?.total ?? 0)
      setTotalPaginas(data.pagination?.totalPages ?? 1)
      modal.showSuccess('Paciente cadastrado com sucesso.')
    } catch (err) {
      setErroCadastro(err.response?.data?.message || 'Erro ao cadastrar paciente.')
    } finally {
      setSalvando(false)
    }
  }

  function mudarBusca(valor) {
    setBusca(valor)
    setPagina(1)
  }

  function mudarEscopo(novoEscopo) {
    setEscopo(novoEscopo)
    setPagina(1)
  }

  return (
    <>
      <div className="pacientes-page-header">
        <div>
          <h1>Pacientes</h1>
          <p>Seus pacientes cadastrados</p>
        </div>
        <div className="pacientes-header-actions">
          {podeCadastrar && (
            <select
              className="pacientes-scope-select"
              value={escopo}
              onChange={(e) => mudarEscopo(e.target.value)}
            >
              <option value="meus">Meus pacientes</option>
              <option value="todos">Todos os pacientes</option>
            </select>
          )}
          {podeCadastrar && (
            <button
              type="button"
              className="paciente-btn paciente-btn-primary paciente-new-button"
              onClick={() => setModalAberto(true)}
            >
              <Plus size={18} />
              Novo Paciente
            </button>
          )}
        </div>
      </div>

      <div className="pacientes-search-card">
        <Search size={20} />
        <input
          type="text"
          value={busca}
          onChange={(e) => mudarBusca(e.target.value)}
          placeholder="Buscar por código, nome, professor responsável ou nascimento..."
        />
      </div>

      <p className="pacientes-count">{total} paciente(s) encontrado(s)</p>

      <div className="pacientes-table-card">
        <table className="pacientes-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Nascimento</th>
              <th>Professor responsável</th>
              <th className="paciente-actions-header">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map((paciente) => (
              <tr key={paciente.id}>
                <td className="paciente-code">{paciente.codigo}</td>
                <td>
                  <div className="paciente-name-cell">
                    <span className="paciente-avatar">
                      <User size={18} />
                    </span>
                    <strong>{paciente.nomeCompleto}</strong>
                  </div>
                </td>
                <td>{formatarData(paciente.dataNascimento)}</td>
                <td>{obterProfessor(paciente)}</td>
                <td>
                  <div className="paciente-actions">
                    <button
                      type="button"
                      className="paciente-action paciente-action-view"
                      onClick={() => onVerDetalhes(paciente.id)}
                      title="Ver detalhes"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!carregando && pacientes.length === 0 && (
          <div className="pacientes-empty">Nenhum paciente encontrado.</div>
        )}
        {carregando && <div className="pacientes-empty">Carregando pacientes...</div>}
      </div>

      <div className="pacientes-pagination">
        <button
          type="button"
          className="paciente-btn paciente-btn-secondary"
          onClick={() => setPagina((paginaAtual) => Math.max(paginaAtual - 1, 1))}
          disabled={pagina <= 1 || carregando}
        >
          Anterior
        </button>
        <span>
          Página {pagina} de {totalPaginas}
        </span>
        <button
          type="button"
          className="paciente-btn paciente-btn-secondary"
          onClick={() => setPagina((paginaAtual) => Math.min(paginaAtual + 1, totalPaginas))}
          disabled={pagina >= totalPaginas || carregando}
        >
          Proxima
        </button>
      </div>

      <ModalNovoPaciente
        aberto={modalAberto}
        carregando={salvando}
        erro={erroCadastro}
        form={form}
        onChange={atualizarForm}
        onClose={() => {
          setModalAberto(false)
          limparForm()
        }}
        onSubmit={cadastrarPaciente}
      />
    </>
  )
}

function DetalhesPaciente({ pacienteId, onVoltar }) {
  const [paciente, setPaciente] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    async function carregarPaciente() {
      setCarregando(true)
      try {
        const { data } = await api.get(`/pacientes/${pacienteId}`)
        if (ativo) setPaciente(data)
      } catch {
        if (ativo) setPaciente(null)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarPaciente()

    return () => {
      ativo = false
    }
  }, [pacienteId])

  if (carregando) {
    return <div className="pacientes-empty">Carregando paciente...</div>
  }

  if (!paciente) {
    return (
      <div className="pacientes-empty">
        <p>Paciente não encontrado.</p>
        <button type="button" className="paciente-btn paciente-btn-secondary" onClick={onVoltar}>
          Voltar
        </button>
      </div>
    )
  }

  const relatorios = Array.isArray(paciente.relatorios) ? paciente.relatorios : []

  return (
    <>
      <div className="paciente-details-header">
        <button type="button" className="paciente-back-button" onClick={onVoltar}>
          &lt;
        </button>
        <div>
          <h1>Detalhes do Paciente</h1>
          <p>{paciente.codigo}</p>
        </div>
      </div>

      <section className="paciente-details-card">
        <div className="paciente-details-main">
          <span className="paciente-details-avatar">
            <User size={36} />
          </span>
          <div>
            <h2>{paciente.nomeCompleto}</h2>
            <p>
              Código: <span>{paciente.codigo}</span>
            </p>
          </div>
        </div>

        <div className="paciente-details-grid">
          <div className="paciente-detail-box">
            <span>Data de nascimento</span>
            <strong>
              <Calendar size={16} />
              {formatarData(paciente.dataNascimento)}
            </strong>
          </div>
          <div className="paciente-detail-box">
            <span>Professor responsável</span>
            <strong>{obterProfessor(paciente)}</strong>
          </div>
          <div className="paciente-detail-box">
            <span>Diagnóstico (CID-10)</span>
            <strong>{paciente.condicaoSaude || 'Não informado'}</strong>
          </div>
        </div>
      </section>

      <section className="paciente-reports-card">
        <h2>Relatórios ({relatorios.length})</h2>
        {relatorios.length === 0 ? (
          <div className="paciente-report-empty">Nenhum relatório encontrado.</div>
        ) : (
          relatorios.map((relatorio) => (
            <div className="paciente-report-row" key={relatorio.id}>
              <div>
                <strong>
                  REL-{new Date(relatorio.dataCriacao).getFullYear()}-
                  {String(relatorio.id).padStart(3, '0')}
                </strong>
                <p>
                  {relatorio.fisioterapeuta?.nomeCompleto || 'Autor não informado'} -{' '}
                  {formatarData(relatorio.dataCriacao)}
                </p>
              </div>
              <span className={`paciente-status paciente-status-${relatorio.status?.toLowerCase()}`}>
                {relatorio.status}
              </span>
            </div>
          ))
        )}
      </section>
    </>
  )
}

export { ListaPacientes, DetalhesPaciente }
