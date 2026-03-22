import React from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { obterPrefixoCIF, QUALIFICADOR_0_A_4_8_9 } from '../../utils/regrascif'
import './CartaoItemCIF.css'

// Converte array de qualificadores em objeto para lookup rápido
const QUALIFICADOR_LABELS = Object.fromEntries(
  QUALIFICADOR_0_A_4_8_9.map(q => [q.valor, q.rotulo.split(' - ')[1]])
)

/**
 * Card para exibir um item CIF de forma resumida
 */
export function CIFItemCard({ item, onEdit, onRemove }) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)

  const getQualifierDisplay = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="qualifier-value empty">Não preenchido</span>
    }
    return (
      <span className="qualifier-value">
        {value} - {QUALIFICADOR_LABELS[value] || value}
      </span>
    )
  }

  return (
    <div className="cif-item-card">
      <div className="cif-item-header">
        <div className="cif-item-code-info">
          <div className="cif-item-code">{item.codigoCIF}</div>
          <div className="cif-item-description">{item.descricao}</div>
        </div>
      </div>

      <div className="cif-item-qualifiers">
        {prefixo === 'b' && (
          <div className="qualifier-item">
            <div className="qualifier-label">Gravidade da deficiência</div>
            {getQualifierDisplay(item.qualificador1)}
          </div>
        )}

        {prefixo === 's' && (
          <>
            <div className="qualifier-item">
              <div className="qualifier-label">Extensão</div>
              {getQualifierDisplay(item.qualificador1)}
            </div>
            <div className="qualifier-item">
              <div className="qualifier-label">Natureza</div>
              {getQualifierDisplay(item.qualificador2)}
            </div>
            <div className="qualifier-item">
              <div className="qualifier-label">Localização</div>
              {getQualifierDisplay(item.qualificador3)}
            </div>
          </>
        )}

        {prefixo === 'd' && (
          <>
            <div className="qualifier-item">
              <div className="qualifier-label">Desempenho</div>
              {getQualifierDisplay(item.qualificador1)}
            </div>
            <div className="qualifier-item">
              <div className="qualifier-label">Capacidade</div>
              {getQualifierDisplay(item.qualificador2)}
            </div>
          </>
        )}

        {prefixo === 'e' && (
          <>
            <div className="qualifier-item">
              <div className="qualifier-label">Tipo</div>
              <span className="qualifier-value">
                {item.tipoQualificador1 === 'BARREIRA' ? 'Barreira' : 
                 item.tipoQualificador1 === 'FACILITADOR' ? 'Facilitador' : 
                 'Não definido'}
              </span>
            </div>
            <div className="qualifier-item">
              <div className="qualifier-label">Grau</div>
              {getQualifierDisplay(item.qualificador1)}
            </div>
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
