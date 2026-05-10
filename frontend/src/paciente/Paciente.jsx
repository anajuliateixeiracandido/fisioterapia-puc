import { useEffect, useMemo, useState } from 'react'
import { Eye, Plus, Search, UserRound } from 'lucide-react'
import DataTable from '../utils/components/DataTable'
import { listarPacientes } from '../services/paciente.service'
import { formatarData } from '../utils/utilities'
import './Paciente.css'

const formatarProfessor = (professorResponsavel) => {
  if (!professorResponsavel) {
    return 'Nao informado'
  }

  if (typeof professorResponsavel === 'string') {
    return professorResponsavel
  }

  if (typeof professorResponsavel === 'object') {
    return (
      professorResponsavel.fisioterapeuta?.nomeCompleto ??
      'Nao informado'
    )
  }

  return 'Nao informado'
}

function Paciente() {
  const [pacientes, setPacientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [termoBusca, setTermoBusca] = useState('')

  useEffect(() => {
    let ativo = true

    const buscarPacientes = async () => {
      try {
        setCarregando(true)
        setErro('')
        const resultado = await listarPacientes()

        if (ativo) {
          setPacientes(resultado)
        }
      } catch {
        if (ativo) {
          setErro('Nao foi possivel carregar a lista de pacientes.')
        }
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    buscarPacientes()

    return () => {
      ativo = false
    }
  }, [])

  const pacientesNormalizados = useMemo(() => {
    return pacientes.map((paciente, index) => ({
      id: paciente.id ?? paciente.pacienteId ?? index,
      codigo: paciente.codigo ?? `PAC-${String(index + 1).padStart(3, '0')}`,
      nome: paciente.nomeCompleto ?? 'Sem nome',
      nascimento: formatarData(paciente.dataNascimento),
      professor: formatarProfessor(paciente.professor),
    }))
  }, [pacientes])

  const pacientesFiltrados = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase()

    if (!termo) {
      return pacientesNormalizados
    }

    return pacientesNormalizados.filter(
      (paciente) =>
        paciente.nome.toLowerCase().includes(termo) ||
        paciente.codigo.toLowerCase().includes(termo),
    )
  }, [pacientesNormalizados, termoBusca])

  const colunasTabela = useMemo(
    () => [
      {
        header: 'Codigo',
        accessor: 'codigo',
        width: '140px',
        cellClassName: 'pacientes-cell-codigo',
      },
      {
        header: 'Nome',
        id: 'nome',
        render: (paciente) => (
          <div className="pacientes-cell-nome">
            <span className="pacientes-avatar">
              <UserRound size={18} strokeWidth={2.2} />
            </span>
            <span className="pacientes-nome-texto">{paciente.nome}</span>
          </div>
        ),
      },
      {
        header: 'Nascimento',
        accessor: 'nascimento',
        width: '180px',
      },
      {
        header: 'Professor responsavel',
        accessor: 'professor',
      },
      {
        header: 'Acoes',
        id: 'acoes',
        width: '220px',
        headerClassName: 'pacientes-th-acoes',
        cellClassName: 'pacientes-cell-acoes',
        render: () => (
          <button className="pacientes-btn-detalhes" type="button">
            <Eye size={18} strokeWidth={2.3} />
            Ver detalhes
          </button>
        ),
      },
    ],
    [],
  )

  return (
    <section className="pacientes-page">
      <div className="pacientes-topo">
        <div className="page-header pacientes-cabecalho">
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">Seus pacientes cadastrados</p>
        </div>

        <button className="pacientes-btn-novo" type="button">
          <Plus size={20} strokeWidth={2.4} />
          Novo Paciente
        </button>
      </div>

      <div className="pacientes-busca-wrapper">
        <Search className="pacientes-busca-icone" size={22} strokeWidth={2.1} />
        <input
          className="pacientes-busca-input"
          onChange={(event) => setTermoBusca(event.target.value)}
          placeholder="Buscar por nome ou codigo do paciente..."
          type="text"
          value={termoBusca}
        />
      </div>

      {carregando && <p className="pacientes-feedback">Carregando pacientes...</p>}
      {!carregando && erro && <p className="pacientes-feedback pacientes-feedback--erro">{erro}</p>}
      {!carregando && !erro && pacientes.length === 0 && (
        <p className="pacientes-feedback">Nenhum paciente encontrado.</p>
      )}

      {!carregando && !erro && (
        <>
          <p className="pacientes-quantidade">{pacientesFiltrados.length} paciente(s) encontrado(s)</p>
          <DataTable
            columns={colunasTabela}
            data={pacientesFiltrados}
            emptyMessage="Nenhum paciente encontrado para o filtro informado."
            rowKey="id"
          />
        </>
      )}
    </section>
  )
}

export default Paciente
