import React from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import {
  obterPrefixoCIF,
  QUALIFICADOR_0_A_4_8_9,
  OPCOES_NATUREZA_ESTRUTURA,
  OPCOES_LOCALIZACAO_ESTRUTURA,
} from '../../utils/regrascif'
import './CartaoItemCIF.css'

// Mapas de labels por tipo de opção
const QUALIFICADOR_LABELS = Object.fromEntries(
  QUALIFICADOR_0_A_4_8_9.map((q) => [q.valor, q.rotulo.split(' - ')[1]])
)
const NATUREZA_LABELS = Object.fromEntries(
  OPCOES_NATUREZA_ESTRUTURA.map((q) => [q.valor, q.rotulo.split(' - ')[1]])
)
const LOCALIZACAO_LABELS = Object.fromEntries(
  OPCOES_LOCALIZACAO_ESTRUTURA.map((q) => [q.valor, q.rotulo.split(' - ')[1]])
)

function temValor(v) {
  return v !== null && v !== undefined && v !== ''
}

function QualifierDisplay({ value, labelMap = QUALIFICADOR_LABELS }) {
  if (!temValor(value)) {
    return <span className="qualifier-value empty">Não preenchido</span>
  }
  return (
    <span className="qualifier-value">
      {value} — {labelMap[value] ?? value}
    </span>
  )
}

function QualifierItem({ label, value, labelMap }) {
  return (
    <div className="qualifier-item">
      <div className="qualifier-label">{label}</div>
      <QualifierDisplay value={value} labelMap={labelMap} />
    </div>
  )
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

        {/* ── b: Funções do Corpo ──────────────────── */}
        {prefixo === 'b' && (
          <QualifierItem
            label="Gravidade da deficiência"
            value={item.qualificador1}
            labelMap={QUALIFICADOR_LABELS}
          />
        )}

        {/* ── s: Estruturas do Corpo ───────────────── */}
        {prefixo === 's' && (
          <>
            <QualifierItem
              label="Extensão"
              value={item.qualificador1}
              labelMap={QUALIFICADOR_LABELS}
            />
            <QualifierItem
              label="Natureza"
              value={item.qualificador2}
              labelMap={NATUREZA_LABELS}
            />
            <QualifierItem
              label="Localização"
              value={item.qualificador3}
              labelMap={LOCALIZACAO_LABELS}
            />
          </>
        )}

        {/* ── d: Actividades e Participação ────────── */}
        {prefixo === 'd' && (
          <>
            <QualifierItem
              label="Desempenho"
              value={item.qualificador1}
              labelMap={QUALIFICADOR_LABELS}
            />
            <QualifierItem
              label="Capacidade"
              value={item.qualificador2}
              labelMap={QUALIFICADOR_LABELS}
            />
            {temValor(item.qualificador3) && (
              <QualifierItem
                label="Capacidade com auxílio"
                value={item.qualificador3}
                labelMap={QUALIFICADOR_LABELS}
              />
            )}
            {temValor(item.qualificador4) && (
              <QualifierItem
                label="Desempenho sem auxílio"
                value={item.qualificador4}
                labelMap={QUALIFICADOR_LABELS}
              />
            )}
          </>
        )}

        {/* ── e: Factores Ambientais ────────────────── */}
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
            <QualifierItem
              label="Grau"
              value={item.qualificador1}
              labelMap={QUALIFICADOR_LABELS}
            />
          </>
        )}
      </div>

      {item.observacao && (
        <div className="cif-item-observation">
          <strong>Observação:</strong> {item.observacao}
        </div>
      )}

      {(onEdit || onRemove) && (
        <div className="cif-item-actions">
          {onEdit && (
            <button type="button" className="cif-item-btn" onClick={onEdit}>
              <Edit2 size={14} />
              Editar
            </button>
          )}
          {onRemove && (
            <button type="button" className="cif-item-btn danger" onClick={onRemove}>
              <Trash2 size={14} />
              Remover
            </button>
          )}
        </div>
      )}
    </div>
  )
}