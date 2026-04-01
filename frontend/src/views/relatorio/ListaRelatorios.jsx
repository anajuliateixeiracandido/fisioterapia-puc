import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Eye, Pencil, CheckCircle, FileText, Lock, Calendar, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { ReportForm } from './FormularioRelatorio'
import './ListaRelatorios.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

const STATUS_CONFIG = {
    ENVIADO: { label: 'Enviado', cor: 'blue' },
    APROVADO: { label: 'Aprovado', cor: 'green' },
    NEGADO: { label: 'Negado', cor: 'red' },
    CORRIGIDO: { label: 'Corrigido', cor: 'orange' },
}

const STATUS_OPTIONS = [
    { value: '', label: 'Todos os status' },
    { value: 'ENVIADO', label: 'Enviado' },
    { value: 'APROVADO', label: 'Aprovado' },
    { value: 'NEGADO', label: 'Negado' },
    { value: 'CORRIGIDO', label: 'Corrigido' },
]

function formatarCodigo(id, dataCriacao) {
    const ano = dataCriacao ? new Date(dataCriacao).getFullYear() : new Date().getFullYear()
    return `REL-${ano}-${String(id).padStart(3, '0')}`
}

function formatarData(isoString) {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleDateString('pt-BR')
}

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, cor: 'gray' }
    return (
        <span className={`status-badge status-badge--${cfg.cor}`}>
            <span className="status-badge__dot" />
            {cfg.label}
        </span>
    )
}

function RelatorioRow({ relatorio, user, onVer, onEditar, onAvaliar }) {
    const isAprovado = relatorio.status === 'APROVADO'
    const codigo = formatarCodigo(relatorio.id, relatorio.dataCriacao)

    const isAutor = relatorio.fisioterapeuta?.id === user?.fisioterapeutaId
    const podeEditar = user?.role === 'ALUNO' && isAutor && !isAprovado

    const isSupervisor = relatorio.professorResponsavel?.fisioterapeuta?.id === user?.fisioterapeutaId
    const podeAvaliar = user?.role === 'PROFESSOR' && isSupervisor && !isAprovado

    return (
        <tr className="relatorio-row">
            <td>
                <div className="relatorio-codigo">
                    <button type="button" className="codigo-link" onClick={() => onVer(relatorio)}>
                        {codigo}
                    </button>
                    {isAprovado && <Lock size={12} className="codigo-lock" />}
                </div>
            </td>
            <td><span className="nome-principal">{relatorio.paciente?.nomeCompleto ?? '—'}</span></td>
            <td><span className="nome-secundario">{relatorio.fisioterapeuta?.nomeCompleto ?? '—'}</span></td>
            <td><span className="nome-secundario">{relatorio.professorResponsavel?.fisioterapeuta?.nomeCompleto ?? '—'}</span></td>
            <td><StatusBadge status={relatorio.status} /></td>
            <td className="data-cell">{formatarData(relatorio.dataAprovacao ?? relatorio.dataCriacao)}</td>
            <td>
                <div className="acoes">
                    <button type="button" className="acao-btn acao-btn--ver" onClick={() => onVer(relatorio)}>
                        <Eye size={14} /> Ver
                    </button>
                    {podeEditar && (
                        <button
                            type="button"
                            className="acao-btn acao-btn--editar"
                            onClick={() => onEditar(relatorio)}
                        >
                            <Pencil size={14} />
                            {relatorio.status === 'NEGADO' ? 'Corrigir' : 'Editar'}
                        </button>
                    )}
                    {podeAvaliar && (
                        <button type="button" className="acao-btn acao-btn--avaliar" onClick={() => onAvaliar(relatorio)}>
                            <CheckCircle size={14} /> Avaliar
                        </button>
                    )}
                </div>
            </td>
        </tr>
    )
}

function Paginacao({ pagination, onMudarPagina }) {
    if (!pagination || pagination.totalPages <= 1) return null
    const { page, totalPages, total } = pagination

    return (
        <div className="paginacao">
            <span className="paginacao__info">
                Página {page} de {totalPages} ({total} resultado{total !== 1 ? 's' : ''})
            </span>
            <div className="paginacao__botoes">
                <button
                    type="button"
                    className="paginacao__btn"
                    onClick={() => onMudarPagina(page - 1)}
                    disabled={page <= 1}
                >
                    <ChevronLeft size={16} />
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p = i + 1
                    if (totalPages > 5 && page > 3) p = page - 2 + i
                    if (p > totalPages) return null
                    return (
                        <button
                            key={p}
                            type="button"
                            className={`paginacao__btn ${p === page ? 'paginacao__btn--activo' : ''}`}
                            onClick={() => onMudarPagina(p)}
                        >
                            {p}
                        </button>
                    )
                })}

                <button
                    type="button"
                    className="paginacao__btn"
                    onClick={() => onMudarPagina(page + 1)}
                    disabled={page >= totalPages}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    )
}

export function ListaRelatorios({ user, onVerRelatorio, onEditarRelatorio, onAvaliarRelatorio }) {
    const [view, setView] = useState('lista')
    const [relatorios, setRelatorios] = useState([])
    const [pagination, setPagination] = useState(null)
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState(null)
    const [busca, setBusca] = useState('')
    const [status, setStatus] = useState('')
    const [dataInicio, setDataInicio] = useState('')
    const [dataFim, setDataFim] = useState('')
    const [pagina, setPagina] = useState(1)

    const fetchRelatorios = useCallback(async () => {
        setCarregando(true)
        setErro(null)
        try {
            const params = new URLSearchParams()
            params.append('page', String(pagina))
            params.append('limit', '15')
            params.append('tipo', 'todos')

            if (busca.trim()) {
                params.append('nomePaciente', busca.trim())
                params.append('nomeResponsavel', busca.trim())
            }
            if (status) params.append('status', status)
            if (dataInicio) params.append('dataInicio', dataInicio)
            if (dataFim) params.append('dataFim', dataFim)

            const token = localStorage.getItem('accessToken')

            const res = await fetch(`${API_BASE}/relatorios?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            })
            if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)

            const json = await res.json()
            setRelatorios(json.data ?? [])
            setPagination(json.pagination ?? null)
        } catch (e) {
            setErro(e.message)
        } finally {
            setCarregando(false)
        }
    }, [busca, status, dataInicio, dataFim, pagina])

    useEffect(() => {
        if (view === 'lista') fetchRelatorios()
    }, [fetchRelatorios, view])

    useEffect(() => { setPagina(1) }, [busca, status, dataInicio, dataFim])


    const handleSalvarRelatorio = async (dadosFormulario) => {
        try {
            const token = localStorage.getItem('accessToken')

            const res = await fetch(`${API_BASE}/relatorios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    pacienteId: dadosFormulario.pacienteId,
                    formularioCIF: {
                        tipoCIF: dadosFormulario.tipoCIF,
                        dataPreenchimento: dadosFormulario.dataPreenchimento,
                        condicaoSaude: dadosFormulario.condicaoSaude,
                        condicaoSaudeDescricao: dadosFormulario.condicaoSaudeDescricao,
                        factoresPessoais: dadosFormulario.factoresPessoais,
                        planoTerapeutico: dadosFormulario.planoTerapeutico,
                        itens: dadosFormulario.itens ?? [],
                    },
                }),
            })
            if (!res.ok) throw new Error('Erro ao guardar relatório')
            setView('lista')
        } catch (e) {
            alert(`Erro: ${e.message}`)
        }
    }

    if (view === 'form') {
        return (
            <div className="lista-relatorios">
                <div className="lista-relatorios__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            type="button"
                            className="btn-voltar"
                            onClick={() => setView('lista')}
                        >
                            <ArrowLeft size={18} />
                            Voltar
                        </button>
                        <div>
                            <h1 className="lista-relatorios__title">Novo Relatório</h1>
                            <p className="lista-relatorios__subtitle">Preencha o formulário CIF</p>
                        </div>
                    </div>
                </div>

                <ReportForm
                    onSaveDraft={(dados) => console.log('Rascunho:', dados)}
                    onSubmitReport={handleSalvarRelatorio}
                />
            </div>
        )
    }

    return (
        <div className="lista-relatorios">
            <div className="lista-relatorios__header">
                <div>
                    <h1 className="lista-relatorios__title">Relatórios</h1>
                    <p className="lista-relatorios__subtitle">Seus relatórios clínicos</p>
                </div>
                <button
                    type="button"
                    className="btn-novo-relatorio"
                    onClick={() => setView('form')}
                >
                    <Plus size={18} /> Novo Relatório
                </button>
            </div>

            <div className="lista-relatorios__filtros">
                <div className="filtro-busca">
                    <Search size={16} className="filtro-busca__icon" />
                    <input
                        type="text"
                        placeholder="Buscar por código, paciente ou aluno..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="filtro-busca__input"
                    />
                </div>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="filtro-select"
                >
                    {STATUS_OPTIONS.map((op) => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                </select>

                <div className="filtro-data">
                    <Calendar size={14} className="filtro-data__icon" />
                    <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="filtro-data__input"
                    />
                </div>

                <div className="filtro-data">
                    <Calendar size={14} className="filtro-data__icon" />
                    <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="filtro-data__input"
                    />
                </div>
            </div>


            {!carregando && !erro && pagination && (
                <p className="lista-relatorios__contador">
                    {pagination.total} relatório(s) encontrado(s)
                </p>
            )}

            {carregando && (
                <div className="lista-relatorios__estado">
                    <div className="spinner" />
                    <p>A carregar relatórios...</p>
                </div>
            )}

            {erro && (
                <div className="lista-relatorios__estado lista-relatorios__estado--erro">
                    <p>Erro: {erro}</p>
                    <button type="button" onClick={fetchRelatorios}>Tentar novamente</button>
                </div>
            )}

            {!carregando && !erro && relatorios.length === 0 && (
                <div className="lista-relatorios__estado lista-relatorios__estado--vazio">
                    <FileText size={48} />
                    <p>Nenhum relatório encontrado</p>
                    {!busca && !status && (
                        <button
                            type="button"
                            className="btn-novo-relatorio btn-novo-relatorio--outline"
                            onClick={() => setView('form')}
                        >
                            <Plus size={16} /> Criar primeiro relatório
                        </button>
                    )}
                </div>
            )}

            {!carregando && !erro && relatorios.length > 0 && (
                <>
                    <div className="tabela-wrapper">
                        <table className="tabela-relatorios">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Paciente</th>
                                    <th>Aluno</th>
                                    <th>Professor</th>
                                    <th>Status</th>
                                    <th>Atualização</th>
                                    <th className="th-acoes">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {relatorios.map((r) => (
                                    <RelatorioRow
                                        key={r.id}
                                        relatorio={r}
                                        user={user}
                                        onVer={onVerRelatorio}
                                        onEditar={onEditarRelatorio}
                                        onAvaliar={onAvaliarRelatorio}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Paginacao pagination={pagination} onMudarPagina={setPagina} />
                </>
            )}
        </div>
    )
}