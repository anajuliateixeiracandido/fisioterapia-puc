import React from 'react'
import { User, Calendar, FileText, AlertCircle, CheckCircle, Mail, ArrowLeft } from 'lucide-react'
import { CIFItemCard } from './CartaoItemCIF'
import { STATUS_RELATORIO, CIF_TYPES } from '../../constants/relatorio.constants'
import { formatarData, formatarDataHora, calcularIdade } from '../../utils/formatadores'
import './VisualizacaoRelatorio.css'
import { useVisualizacaoRelatorioViewModel } from '../../viewmodels/useVisualizacaoRelatorioViewModel'

function StatusBadge({ status }) {
  const cfg = STATUS_RELATORIO[status] ?? { label: status, cor: 'gray', icon: FileText }
  const Icon = cfg.icon
  return (
    <div className={`status-badge-large status-badge-large--${cfg.cor}`}>
      <Icon size={20} />
      <span>{cfg.label}</span>
    </div>
  )
}

export function VisualizacaoRelatorio({ relatorio: relatorioInicial, user, onVisualizarPaciente, acoes, onVoltar }) {
  const { relatorio, carregando, erro } = useVisualizacaoRelatorioViewModel(relatorioInicial, user)

  if (carregando) {
    return (
      <div className="visualizacao-loading">
        <div className="loading-spinner"></div>
        <p>Carregando relatório...</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="visualizacao-error">
        <AlertCircle size={48} />
        <h3>Erro ao carregar relatório</h3>
        <p>{erro}</p>
      </div>
    )
  }

  if (!relatorio?.formularioCIF) {
    return (
      <div className="visualizacao-error">
        <AlertCircle size={48} />
        <h3>Relatório não encontrado</h3>
        <p>Não foi possível carregar os dados do relatório.</p>
      </div>
    )
  }

  const { formularioCIF, paciente, fisioterapeuta, professorResponsavel, feedbacks, datasFeedback } = relatorio
  const codigo = `REL-${new Date(relatorio.dataCriacao).getFullYear()}-${String(relatorio.id).padStart(3, '0')}`

  const itensPorCategoria = (formularioCIF.itens || []).reduce((acc, item) => {
    const prefixo = String(item.codigoCIF || '').charAt(0).toLowerCase()
    if (!acc[prefixo]) acc[prefixo] = []
    acc[prefixo].push(item)
    return acc
  }, {})

  return (
    <div className="visualizacao-relatorio">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="visualizacao-header">
        <div className="header-info">
          {onVoltar && (
            <button type="button" className="header-voltar" onClick={onVoltar}>
              <ArrowLeft size={18} />
            </button>
          )}
          {acoes && <div className="header-acoes">{acoes}</div>}
        </div>
        <div>
          <h2 className="relatorio-codigo">{codigo}</h2>
          <StatusBadge status={relatorio.status} />
        </div>
        <div className="header-meta">
          <div className="meta-item">
            <Calendar size={16} />
            <span>Criado em: {formatarDataHora(relatorio.dataCriacao)}</span>
          </div>
          {relatorio.dataAprovacao && (
            <div className="meta-item">
              <CheckCircle size={16} />
              <span>Aprovado em: {formatarDataHora(relatorio.dataAprovacao)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Responsáveis ──────────────────────────────────────────────────── */}
      <div className="visualizacao-section">
        <h3 className="section-title"><User size={20} />Responsáveis</h3>
        <div className="responsaveis-grid">
          <div className="responsavel-card">
            <div className="responsavel-label">Autor</div>
            <div className="responsavel-nome">{fisioterapeuta?.nomeCompleto || '—'}</div>
            {fisioterapeuta?.email && (
              <div className="responsavel-info"><Mail size={14} />{fisioterapeuta.email}</div>
            )}
          </div>
          {professorResponsavel && (
            <div className="responsavel-card">
              <div className="responsavel-label">Professor Supervisor</div>
              <div className="responsavel-nome">{professorResponsavel.fisioterapeuta?.nomeCompleto || '—'}</div>
              {professorResponsavel.fisioterapeuta?.email && (
                <div className="responsavel-info"><Mail size={14} />{professorResponsavel.fisioterapeuta.email}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Dados do Paciente (apenas dados cadastrais) ───────────────────── */}
      {paciente && (
        <div className="visualizacao-section">
          <h3 className="section-title"><User size={20} />Dados do Paciente</h3>
          <div className="paciente-info-grid">
            <div className="info-item">
              <span className="info-label">Código</span>
              <span className="info-value">{paciente.codigo}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Nome Completo</span>
              {onVisualizarPaciente ? (
                <button type="button" className="info-value-link" onClick={() => onVisualizarPaciente(paciente)}>
                  {paciente.nomeCompleto}
                </button>
              ) : (
                <span className="info-value">{paciente.nomeCompleto}</span>
              )}
            </div>
            <div className="info-item">
              <span className="info-label">Data de Nascimento</span>
              <span className="info-value">{formatarData(paciente.dataNascimento)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Idade</span>
              <span className="info-value">{calcularIdade(paciente.dataNascimento)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Sexo</span>
              <span className="info-value">{paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
            </div>
            {paciente.alergias && (
              <div className="info-item full-width">
                <span className="info-label">Alergias</span>
                <span className="info-value">{paciente.alergias}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Formulário CIF ────────────────────────────────────────────────── */}
      <div className="visualizacao-section">
        <h3 className="section-title"><FileText size={20} />Avaliação CIF</h3>

        <div className="cif-header-info">
          <div className="info-item">
            <span className="info-label">Tipo CIF</span>
            <span className="info-value">
              {formularioCIF.tipoCIF === 'CIF' ? 'CIF - Adultos' : 'CIF-CJ - Crianças e Jovens'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Data de Preenchimento</span>
            <span className="info-value">{formatarData(formularioCIF.dataPreenchimento)}</span>
          </div>
          {formularioCIF.ultimaAlteracao && (
            <div className="info-item">
              <span className="info-label">Última Alteração</span>
              <span className="info-value">{formatarDataHora(formularioCIF.ultimaAlteracao)}</span>
            </div>
          )}
        </div>

        {/* Condição de saúde */}
        {formularioCIF.condicaoSaude && (
          <div className="cif-field">
            <div className="field-label">Condição de Saúde</div>
            <div className="field-value">{formularioCIF.condicaoSaude}</div>
          </div>
        )}
        <div className="cif-field">
          <div className="field-label">Descrição da Condição de Saúde</div>
          <div className="field-value">{formularioCIF.condicaoSaudeDescricao}</div>
        </div>

        {/* Dados clínicos da avaliação */}
        {formularioCIF.queixaPrincipal && (
          <div className="cif-field">
            <div className="field-label">Queixa Principal</div>
            <div className="field-value">{formularioCIF.queixaPrincipal}</div>
          </div>
        )}
        {formularioCIF.demandaReabilitacao && (
          <div className="cif-field">
            <div className="field-label">Demanda de Reabilitação</div>
            <div className="field-value">{formularioCIF.demandaReabilitacao}</div>
          </div>
        )}

        {/* Atividade 1 e Atividade 2 lado a lado */}
        {(formularioCIF.atividadeLimitacao || formularioCIF.restricaoParticipacao) && (
          <div className="cif-field">
            <div className="atividades-grid">
              {formularioCIF.atividadeLimitacao && (
                <div className="atividade-card atividade-card--limitacao">
                  <span className="atividade-badge">Atividade 1</span>
                  <span className="info-label">Limitação de Atividade</span>
                  <p className="atividade-descricao">{formularioCIF.atividadeLimitacao}</p>
                  <span className="atividade-hint">d1–d6 · perspectiva individual</span>
                </div>
              )}
              {formularioCIF.restricaoParticipacao && (
                <div className="atividade-card atividade-card--participacao">
                  <span className="atividade-badge">Atividade 2</span>
                  <span className="info-label">Restrição de Participação Social</span>
                  <p className="atividade-descricao">{formularioCIF.restricaoParticipacao}</p>
                  <span className="atividade-hint">d7–d9 · perspectiva social</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fatores pessoais */}
        {formularioCIF.factoresPessoais && (
          <div className="cif-field">
            <div className="field-label">Fatores Pessoais</div>
            <div className="field-value">{formularioCIF.factoresPessoais}</div>
          </div>
        )}

        {/* Condutas */}
        {formularioCIF.planoTerapeutico && (
          <div className="cif-field">
            <div className="field-label">Condutas</div>
            <div className="field-value">{formularioCIF.planoTerapeutico}</div>
          </div>
        )}

        {/* Diagnóstico e objetivos */}
        {(formularioCIF.diagnosticoFisioterapeutico || formularioCIF.objetivoCurtoPrazo || formularioCIF.objetivoLongoPrazo) && (
          <div className="cif-field-group">
            {formularioCIF.diagnosticoFisioterapeutico && (
              <div className="cif-field">
                <div className="field-label">Diagnóstico Fisioterapêutico</div>
                <div className="field-value">{formularioCIF.diagnosticoFisioterapeutico}</div>
              </div>
            )}
            {(formularioCIF.objetivoCurtoPrazo || formularioCIF.objetivoLongoPrazo) && (
              <div className="cif-field">
                <div className="field-label">Plano de Tratamento para a Atividade Examinada</div>
                {formularioCIF.objetivoCurtoPrazo && (
                  <div className="field-subvalue">
                    <strong>Curto prazo:</strong> {formularioCIF.objetivoCurtoPrazo}
                  </div>
                )}
                {formularioCIF.objetivoLongoPrazo && (
                  <div className="field-subvalue">
                    <strong>Longo prazo:</strong> {formularioCIF.objetivoLongoPrazo}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Observações ───────────────────────────────────────────────────── */}
      {formularioCIF.observacoes && (
        <div className="visualizacao-section">
          <h3 className="section-title"><FileText size={20} />Observações Gerais</h3>
          <div className="field-value">{formularioCIF.observacoes}</div>
        </div>
      )}

      {/* ── Itens CIF ─────────────────────────────────────────────────────── */}
      {Object.keys(itensPorCategoria).length > 0 && (
        <div className="visualizacao-section">
          <h3 className="section-title"><FileText size={20} />Classificação CIF</h3>
          {['b', 's', 'd', 'e'].map(prefixo => {
            const itens = itensPorCategoria[prefixo]
            if (!itens || itens.length === 0) return null
            const tipoInfo = CIF_TYPES[prefixo]
            return (
              <div key={prefixo} className="categoria-section">
                <div className="categoria-header">
                  <h4 className="categoria-titulo">{tipoInfo.label}</h4>
                  <p className="categoria-descricao">{tipoInfo.description}</p>
                  <span className="categoria-contador">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</span>
                </div>
                <div className="categoria-itens">
                  {itens.map((item, idx) => (
                    <div key={idx} className="item-visualizacao">
                      <CIFItemCard item={item} onEdit={null} onRemove={null} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Feedbacks ─────────────────────────────────────────────────────── */}
      {feedbacks && feedbacks.length > 0 && (
        <div className="visualizacao-section">
          <h3 className="section-title"><AlertCircle size={20} />Histórico de Feedbacks</h3>
          <div className="feedbacks-lista">
            {feedbacks.map((feedback, idx) => (
              <div key={idx} className="feedback-item">
                <div className="feedback-header">
                  <span className="feedback-numero">Feedback #{idx + 1}</span>
                  {datasFeedback && datasFeedback[idx] && (
                    <span className="feedback-data">{formatarDataHora(datasFeedback[idx])}</span>
                  )}
                </div>
                <div className="feedback-conteudo">{feedback}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}