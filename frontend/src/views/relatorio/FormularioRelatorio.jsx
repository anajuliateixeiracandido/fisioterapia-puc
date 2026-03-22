import React, { useState, useMemo } from 'react'
import { FileText, Save, Send, AlertCircle, Plus } from 'lucide-react'
import { FormularioHeaderSection } from './FormularioHeaderSection'
import { CIFItemCard } from './CartaoItemCIF'
import { obterPrefixoCIF } from '../../utils/regrascif'
import './FormularioRelatorio.css'

const CIF_TYPES = [
  { 
    key: 'b', 
    label: 'Funções do Corpo',
    description: 'Funções fisiológicas dos sistemas do corpo',
  },
  { 
    key: 's', 
    label: 'Estruturas do Corpo',
    description: 'Partes anatômicas do corpo',
  },
  { 
    key: 'd', 
    label: 'Atividades e Participação',
    description: 'Execução de tarefas e envolvimento em situações da vida',
  },
  { 
    key: 'e', 
    label: 'Fatores Ambientais',
    description: 'Ambiente físico, social e de atitudes',
  },
]

/**
 * Formulário completo de relatório CIF (View)
 * @param {object} props
 * @param {Array} props.references - Referências CIF disponíveis
 * @param {function} props.onSaveDraft - Callback para salvar rascunho
 * @param {function} props.onSubmitReport - Callback para enviar relatório
 */
export function ReportForm({ references, onSaveDraft, onSubmitReport }) {
  const initialForm = {
    tipoCIF: 'CIF',
    dataPreenchimento: new Date().toISOString().slice(0, 16),
    condicaoSaude: '',
    condicaoSaudeDescricao: '',
    factoresPessoais: '',
    planoTerapeutico: '',
    observacoes: '',
    itens: [],
  }

  const [form, setForm] = useState(initialForm)

  const updateForm = (updates) => setForm(prev => ({ ...prev, ...updates }))
  const updateItens = (itens) => setForm(prev => ({ ...prev, itens }))
  const canSubmit = form.condicaoSaudeDescricao.trim().length > 0 && form.itens.length > 0

  // Agrupa itens por tipo
  const itemsByType = useMemo(() => {
    const grouped = { b: [], s: [], d: [], e: [] }
    form.itens.forEach((item, index) => {
      const prefix = obterPrefixoCIF(item.codigoCIF)
      if (grouped[prefix]) {
        grouped[prefix].push({ ...item, globalIndex: index })
      }
    })
    return grouped
  }, [form.itens])

  const handleAddItem = (type) => {
    alert(`Funcionalidade de adicionar item CIF tipo "${type}" em desenvolvimento`)
  }

  const handleEditItem = (globalIndex) => {
    alert(`Funcionalidade de editar item em desenvolvimento (índice: ${globalIndex})`)
  }

  const handleRemoveItem = (globalIndex) => {
    if (confirm('Deseja realmente remover este item?')) {
      updateItens(form.itens.filter((_, index) => index !== globalIndex))
    }
  }

  return (
    <div className="report-form-container">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) onSubmitReport?.(form)
        }}
      >
        {/* Bloco 1 - Cabeçalho do Formulário */}
        <div className="form-section">
          <div className="section-title">
            <div className="section-icon">
              <FileText size={18} />
            </div>
            Dados Gerais do Relatório
          </div>
          <FormularioHeaderSection value={form} onChange={updateForm} />
        </div>

        {/* Bloco 2 - Itens CIF por Tipo */}
        <div className="cif-sections-container">
          {CIF_TYPES.map((type) => {
            const typeItems = itemsByType[type.key]
            
            return (
              <div key={type.key} className={`cif-type-section type-${type.key}`}>
                <div className="cif-type-header">
                  <div className="cif-type-title">
                    <div className={`cif-type-badge type-${type.key}`}>
                      {type.key.toUpperCase()}
                    </div>
                    <div className="cif-type-info">
                      <h3>
                        {type.label}
                        <span className="item-count">{typeItems.length}</span>
                      </h3>
                      <p className="cif-type-description">{type.description}</p>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    className="add-item-button"
                    onClick={() => handleAddItem(type.key)}
                  >
                    <Plus size={16} />
                    Adicionar item
                  </button>
                </div>

                {typeItems.length === 0 ? (
                  <div className="empty-state">
                    Nenhum item adicionado nesta seção
                  </div>
                ) : (
                  <div className="cif-items-list">
                    {typeItems.map((item) => (
                      <CIFItemCard
                        key={item.id ?? item.codigoCIF}
                        item={item}
                        onEdit={() => handleEditItem(item.globalIndex)}
                        onRemove={() => handleRemoveItem(item.globalIndex)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Ações */}
        <div className="form-actions">

          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            <Send size={18} />
            Enviar relatório
          </button>
        </div>

        {!canSubmit && (
          <div className="validation-message">
            <AlertCircle size={16} style={{ display: 'inline', marginRight: 8 }} />
            Para enviar, preencha a descrição da condição de saúde e corrija os itens incompletos.
          </div>
        )}
      </form>
    </div>
  )
}
