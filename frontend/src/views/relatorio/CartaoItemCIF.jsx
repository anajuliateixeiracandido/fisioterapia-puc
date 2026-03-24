import React from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { obterPrefixoCIF, QUALIFICADOR_0_A_4_8_9 } from '../../utils/regrascif'
import './CartaoItemCIF.css'

const QUALIFICADOR_LABELS = Object.fromEntries(
  QUALIFICADOR_0_A_4_8_9.map((q) => [q.valor, q.rotulo.split(' - ')[1]])
)

function QualifierDisplay({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span className="qualifier-value empty">Não preenchido</span>
  }
  return (
    <span className="qualifier-value">
      {value} — {QUALIFICADOR_LABELS[value] ?? value}
    </span>
  )
}

function QualifierItem({ label, value }) {
  return (
    <div className="qualifier-item">
      <div className="qualifier-label">{label}</div>
      <QualifierDisplay value={value} />
    </div>
  )
}

function temValor(v) {
  return v !== null && v !== undefined && v !== ''
}

export function CIFItemCard({ item, onEdit, onRemove }) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)

  return (
    <div className="cif-item-card">
      <div className="cif-item-header">
        <div className="cif-item-code-info">
          <div className="cif-item-code">{item.codigoCIF}</div>
          <div className="cif-item-description">{item.descricao}</div>
        </div>
      </div>

      <div className="cif-item-qualifiers">

        {/* ── Funções do Corpo (b) ─────────────────── */}
        {prefixo === 'b' && (
          <QualifierItem
            label="Gravidade da deficiência"
            value={item.qualificador1}
          />
        )}

        {/* ── Estruturas do Corpo (s) ──────────────── */}
        {prefixo === 's' && (
          <>
            <QualifierItem label="Extensão" value={item.qualificador1} />
            <QualifierItem label="Natureza" value={item.qualificador2} />
            <QualifierItem label="Localização" value={item.qualificador3} />
          </>
        )}

        {/* ── Actividades e Participação (d) ───────── */}
        {prefixo === 'd' && (
          <>
            <QualifierItem label="Desempenho" value={item.qualificador1} />
            <QualifierItem label="Capacidade" value={item.qualificador2} />

            {/* Modo avançado — só mostra se tem valores */}
            {temValor(item.qualificador3) && (
              <QualifierItem
                label="Capacidade com auxílio"
                value={item.qualificador3}
              />
            )}
            {temValor(item.qualificador4) && (
              <QualifierItem
                label="Desempenho sem auxílio"
                value={item.qualificador4}
              />
            )}
          </>
        )}

        {/* ── Factores Ambientais (e) ──────────────── */}
        {prefixo === 'e' && (
          <>
            <div className="qualifier-item">
              <div className="qualifier-label">Tipo</div>
              <span className={`qualifier-value qualifier-env-${item.tipoQualificador1?.toLowerCase() || 'none'}`}>
                {item.tipoQualificador1 === 'BARREIRA'
                  ? '● Barreira'
                  : item.tipoQualificador1 === 'FACILITADOR'
                    ? '+ Facilitador'
                    : 'Não definido'}
              </span>
            </div>
            <QualifierItem label="Grau" value={item.qualificador1} />
            {item.itemRelacionadoCodigo && (
              <div className="qualifier-item">
                <div className="qualifier-label">Relacionado a</div>
                <span className="qualifier-value">{item.itemRelacionadoCodigo}</span>
              </div>
            )}
          </>
        )}
      </div>

      {item.observacao && (
        <div className="cif-item-observation">
          <strong>Observação:</strong> {item.observacao}
        </div>
      )}

      <div className="cif-item-actions">
        <button type="button" className="cif-item-btn" onClick={onEdit}>
          <Edit2 size={14} />
          Editar
        </button>
        <button type="button" className="cif-item-btn danger" onClick={onRemove}>
          <Trash2 size={14} />
          Remover
        </button>
      </div>
    </div>
  )
}