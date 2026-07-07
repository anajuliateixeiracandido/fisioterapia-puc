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

function campoOpcional(valor) {
  const texto = valor.trim()
  return texto || undefined
}

function formatarCpf(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatarTelefone(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)

  if (digitos.length <= 2) {
    return digitos.replace(/(\d{1,2})/, '($1')
  }

  if (digitos.length <= 10) {
    return digitos
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  return digitos
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function obterProfessor(paciente) {
  return paciente?.professor?.fisioterapeuta?.nomeCompleto || 'Não informado'
}

function formatarSexo(sexo) {
  if (sexo === 'M') return 'Masculino'
  if (sexo === 'F') return 'Feminino'
  return 'Nao informado'
}

function exibirValor(valor) {
  if (valor === null || valor === undefined) return 'Nao informado'

  const texto = String(valor).trim()
  return texto || 'Nao informado'
}

function DetalhePacienteCampo({ titulo, children, destaque = false }) {
  return (
    <div className={`paciente-detail-box ${destaque ? 'paciente-detail-box-wide' : ''}`}>
      <span>{titulo}</span>
      <strong>{children}</strong>
    </div>
  )
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
            <span>Sexo</span>
            <select
              value={form.sexo}
              onChange={(e) => onChange({ sexo: e.target.value })}
              disabled={carregando}
            >
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </label>

          <label className="paciente-field">
            <span>CPF</span>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => onChange({ cpf: formatarCpf(e.target.value) })}
              disabled={carregando}
            />
          </label>

          <label className="paciente-field">
            <span>Telefone</span>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={(e) => onChange({ telefone: formatarTelefone(e.target.value) })}
              disabled={carregando}
            />
          </label>

          <label className="paciente-field">
            <span>Endereço</span>
            <input
              type="text"
              placeholder="Rua, número, bairro, cidade"
              value={form.endereco}
              onChange={(e) => onChange({ endereco: e.target.value })}
              disabled={carregando}
            />
          </label>

          <label className="paciente-field">
            <span>E-mail</span>
            <input
              type="email"
              placeholder="paciente@email.com"
              value={form.email}
              onChange={(e) => onChange({ email: e.target.value })}
              disabled={carregando}
            />
          </label>

          <label className="paciente-field">
            <span>Alergias</span>
            <textarea
              rows={3}
              placeholder="Informe alergias conhecidas"
              value={form.alergias}
              onChange={(e) => onChange({ alergias: e.target.value })}
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

          <fieldset className="paciente-fieldset">
            <legend>Contato de emergência</legend>
            <label className="paciente-field">
              <span>Nome</span>
              <input
                type="text"
                placeholder="Nome do contato"
                value={form.contatoEmergenciaNome}
                onChange={(e) => onChange({ contatoEmergenciaNome: e.target.value })}
                disabled={carregando}
              />
            </label>
            <label className="paciente-field">
              <span>Telefone</span>
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={form.contatoEmergenciaTelefone}
                onChange={(e) => onChange({ contatoEmergenciaTelefone: formatarTelefone(e.target.value) })}
                disabled={carregando}
              />
            </label>
            <label className="paciente-field">
              <span>Parentesco</span>
              <input
                type="text"
                placeholder="Ex: mãe, pai, cônjuge"
                value={form.contatoEmergenciaParentesco}
                onChange={(e) => onChange({ contatoEmergenciaParentesco: e.target.value })}
                disabled={carregando}
              />
            </label>
          </fieldset>

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

function ListaPacientes({ onVerDetalhes, escopo: escopoControlado, onEscopoChange }) {
  const modal = useModal()
  const { user } = useAuth()
  const [pacientes, setPacientes] = useState([])
  const [busca, setBusca] = useState('')
  const [escopoInterno, setEscopoInterno] = useState('meus')
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
    sexo: 'M',
    cpf: '',
    telefone: '',
    endereco: '',
    email: '',
    alergias: '',
    condicaoSaude: '',
    contatoEmergenciaNome: '',
    contatoEmergenciaTelefone: '',
    contatoEmergenciaParentesco: '',
  })

  const podeCadastrar = user?.role === 'PROFESSOR' || user?.role === 'ALUNO'
  const podeVerTodos = user?.role === 'PROFESSOR'
  const escopo = escopoControlado ?? escopoInterno

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
      sexo: 'M',
      cpf: '',
      telefone: '',
      endereco: '',
      email: '',
      alergias: '',
      condicaoSaude: '',
      contatoEmergenciaNome: '',
      contatoEmergenciaTelefone: '',
      contatoEmergenciaParentesco: '',
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

    const contatoEmergenciaPreenchido = [
      form.contatoEmergenciaNome,
      form.contatoEmergenciaTelefone,
      form.contatoEmergenciaParentesco,
    ].some((valor) => valor.trim())

    if (
      contatoEmergenciaPreenchido &&
      (!form.contatoEmergenciaNome.trim() ||
        !form.contatoEmergenciaTelefone.trim() ||
        !form.contatoEmergenciaParentesco.trim())
    ) {
      setErroCadastro('Preencha todos os dados do contato de emergência.')
      return
    }

    setSalvando(true)

    try {
      await api.post('/pacientes', {
        nomeCompleto: form.nomeCompleto.trim(),
        dataNascimento: formatarDataParaApi(form.dataNascimento),
        sexo: form.sexo,
        cpf: campoOpcional(form.cpf),
        telefone: campoOpcional(form.telefone),
        endereco: campoOpcional(form.endereco),
        email: campoOpcional(form.email),
        alergias: campoOpcional(form.alergias),
        condicaoSaude: campoOpcional(form.condicaoSaude),
        contatosEmergencia: contatoEmergenciaPreenchido
          ? [
              {
                nome: form.contatoEmergenciaNome.trim(),
                telefone: form.contatoEmergenciaTelefone.trim(),
                parentesco: form.contatoEmergenciaParentesco.trim(),
              },
            ]
          : [],
      })

      setModalAberto(false)
      limparForm()
      definirEscopo('meus')
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

  function definirEscopo(novoEscopo) {
    if (onEscopoChange) {
      onEscopoChange(novoEscopo)
      return
    }

    setEscopoInterno(novoEscopo)
  }

  function mudarEscopo(novoEscopo) {
    definirEscopo(novoEscopo)
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
          {podeVerTodos && (
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

  const contatosEmergencia = Array.isArray(paciente.contatosEmergencia) ? paciente.contatosEmergencia : []

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

      </section>

      <section className="paciente-reports-card paciente-full-details-card">
        <h2>Dados cadastrados</h2>
        <div className="paciente-full-details-grid">
          <DetalhePacienteCampo titulo="Nome completo" destaque>
            {exibirValor(paciente.nomeCompleto)}
          </DetalhePacienteCampo>
          <DetalhePacienteCampo titulo="Data de nascimento">
            <>
              <Calendar size={16} />
              {formatarData(paciente.dataNascimento)}
            </>
          </DetalhePacienteCampo>
          <DetalhePacienteCampo titulo="Sexo">{formatarSexo(paciente.sexo)}</DetalhePacienteCampo>
          <DetalhePacienteCampo titulo="CPF">{exibirValor(paciente.cpf)}</DetalhePacienteCampo>
          <DetalhePacienteCampo titulo="Telefone">{exibirValor(paciente.telefone)}</DetalhePacienteCampo>
          <DetalhePacienteCampo titulo="E-mail">{exibirValor(paciente.email)}</DetalhePacienteCampo>
          <DetalhePacienteCampo titulo="Professor responsavel">{obterProfessor(paciente)}</DetalhePacienteCampo>
          <DetalhePacienteCampo titulo="Endereco" destaque>
            {exibirValor(paciente.endereco)}
          </DetalhePacienteCampo>
          <DetalhePacienteCampo titulo="Diagnostico (CID-10)" destaque>
            {exibirValor(paciente.condicaoSaude)}
          </DetalhePacienteCampo>
          <DetalhePacienteCampo titulo="Alergias" destaque>
            {exibirValor(paciente.alergias)}
          </DetalhePacienteCampo>
        </div>
      </section>

      <section className="paciente-reports-card paciente-emergency-card">
        <h2>Contato de emergencia</h2>
        {contatosEmergencia.length === 0 ? (
          <div className="paciente-report-empty">Nenhum contato de emergencia informado.</div>
        ) : (
          contatosEmergencia.map((contato, index) => (
            <div className="paciente-emergency-row" key={`${contato.nome}-${contato.telefone}-${index}`}>
              <DetalhePacienteCampo titulo="Nome">{exibirValor(contato.nome)}</DetalhePacienteCampo>
              <DetalhePacienteCampo titulo="Telefone">{exibirValor(contato.telefone)}</DetalhePacienteCampo>
              <DetalhePacienteCampo titulo="Parentesco">{exibirValor(contato.parentesco)}</DetalhePacienteCampo>
            </div>
          ))
        )}
      </section>
    </>
  )
}

export { ListaPacientes, DetalhesPaciente }
