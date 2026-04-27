import React from 'react'
import { Plus, Search, FileText, Calendar, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { ReportForm } from './FormularioRelatorio'
import { STATUS_RELATORIO, STATUS_OPTIONS } from '../../constants/relatorio.constants'
import { formatarCodigo, formatarData } from '../../utils/formatadores'
import './ListaRelatorios.css'
import { useListaRelatoriosViewModel } from '../../viewmodels/useListaRelatoriosViewModel'

function StatusBadge({ status }) {
    const cfg = STATUS_RELATORIO[status] ?? { label: status, cor: 'gray' }
    return (
        <span className={`status-badge status-badge--${cfg.cor}`}>
            <span className="status-badge__dot" />
            {cfg.label}
        </span>
    )
}

function RelatorioRow({ relatorio, onVer }) {
    const codigo = formatarCodigo(relatorio.id, relatorio.dataCriacao)
    const mostraProfessor = relatorio.professorResponsavel?.fisioterapeuta?.nomeCompleto ?? '—'

    return (
        <tr className="relatorio-row">
            <td>
                <button type="button" className="codigo-link" onClick={() => onVer(relatorio)}>
                    {codigo}
                </button>
            </td>
            <td><span className="nome-principal">{relatorio.paciente?.nomeCompleto ?? '—'}</span></td>
            <td><span className="nome-secundario">{relatorio.fisioterapeuta?.nomeCompleto ?? '—'}</span></td>
            <td><span className="nome-secundario">{mostraProfessor}</span></td>
            <td><StatusBadge status={relatorio.status} /></td>
            <td className="data-cell">{formatarData(relatorio.dataAprovacao ?? relatorio.dataCriacao)}</td>
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

export function ListaRelatorios({ onVerRelatorio }) {
    const {
        view,
        relatorios,
        pagination,
        carregando,
        erro,
        busca,
        status,
        dataInicio,
        dataFim,
        setView,
        setBusca,
        setStatus,
        setDataInicio,
        setDataFim,
        handleSalvarRelatorio,
        handleMudarPagina,
        fetchRelatorios,
    } = useListaRelatoriosViewModel()

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
                        placeholder="Buscar por nome do paciente..."
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
                    <label className="filtro-data__label">De:</label>
                    <Calendar size={14} className="filtro-data__icon" />
                    <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="filtro-data__input"
                        title="Data de criação - início"
                    />
                </div>

                <div className="filtro-data">
                    <label className="filtro-data__label">Até:</label>
                    <Calendar size={14} className="filtro-data__icon" />
                    <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="filtro-data__input"
                        title="Data de criação - fim"
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
                                </tr>
                            </thead>
                            <tbody>
                                {relatorios.map((r) => (
                                    <RelatorioRow
                                        key={r.id}
                                        relatorio={r}
                                        onVer={onVerRelatorio}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Paginacao pagination={pagination} onMudarPagina={handleMudarPagina} />
                </>
            )}
        </div>
    )
}