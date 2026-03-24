import React, { useState, useMemo, useCallback } from 'react'
import { FileText, Save, Send, AlertCircle, Plus } from 'lucide-react'
import { FormularioHeaderSection } from './FormularioHeaderSection'
import { CIFItemCard } from './CartaoItemCIF'
import { obterPrefixoCIF } from '../../utils/regrascif'
import { fetchCIFReferences } from '../../services/cifApi'
import './FormularioRelatorio.css'
import ModalItemCIF from './ModalItemCIF'

const CIF_TYPES = [
  { key: 'b', label: 'Funções do Corpo', description: 'Funções fisiológicas dos sistemas do corpo' },
  { key: 's', label: 'Estruturas do Corpo', description: 'Partes anatômicas do corpo' },
  { key: 'd', label: 'Atividades e Participação', description: 'Execução de tarefas e envolvimento em situações da vida' },
  { key: 'e', label: 'Fatores Ambientais', description: 'Ambiente físico, social e de atitudes' },
]

const CATEGORIA_MAP = {
  b: 'FUNCAO',
  s: 'ESTRUTURA',
  d: 'ACTIVIDADE_PARTICIPACAO',
  e: 'FACTOR_AMBIENTAL',
}

/**
 * Formulário completo de relatório CIF (View)
 * @param {object} props
 * @param {Array} props.references - Referências CIF disponíveis
 * @param {function} props.onSaveDraft - Callback para salvar rascunho
 * @param {function} props.onSubmitReport - Callback para enviar relatório
 */
export function ReportForm({ onSaveDraft, onSubmitReport }) {
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [currentType, setCurrentType] = useState('b')
  const [referencias, setReferencias] = useState([])
  const [carregandoRefs, setCarregandoRefs] = useState(false)

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

  const updateForm = (updates) => {
    console.log('Atualizando form:', updates)
    setForm(prev => {
      const newForm = { ...prev, ...updates }
      console.log('Estado anterior:', prev)
      console.log('Novo estado:', newForm)
      console.log('tipoCIF mudou de', prev.tipoCIF, 'para', newForm.tipoCIF)
      return newForm
    })
  }
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

  const abrirModal = useCallback(async (type, globalIndex = null) => {
    console.log('=== abrirModal chamado ===')
    console.log('Type:', type)
    console.log('Usando form.tipoCIF:', form.tipoCIF)
    setCarregandoRefs(true)
    setReferencias([])

    try {
      console.log('Buscando CIF com tipoCIF:', form.tipoCIF)
      const data = await fetchCIFReferences(
        CATEGORIA_MAP[type],
        undefined,
        2000,
        0,
        form.tipoCIF
      )
      console.log('Dados recebidos:', data.length, 'itens')
      console.log('Primeiro item:', data[0])
      setReferencias(data)
    } catch (e) {
      console.error('Erro ao carregar referências CIF:', e)
      setReferencias([])
    } finally {
      setCarregandoRefs(false)
    }

    setCurrentType(type)
    setEditingIndex(globalIndex)
    setItemModalOpen(true)
  }, [form.tipoCIF])


  const handleAddItem = (type) => abrirModal(type, null)

  const handleEditItem = (globalIndex) => {
    const item = form.itens[globalIndex]
    const prefix = String(item.codigoCIF || '').charAt(0).toLowerCase() || 'b'
    abrirModal(prefix, globalIndex)
  }

  const handleSaveItem = (itemData) => {
    if (editingIndex !== null) {
      const novosItens = [...form.itens]
      novosItens[editingIndex] = itemData
      updateItens(novosItens)
    } else {
      updateItens([...form.itens, itemData])
    }
    setItemModalOpen(false)
    setEditingIndex(null)
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
                  <div className="empty-state">Nenhum item adicionado nesta seção</div>
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

        <ModalItemCIF
          isOpen={itemModalOpen}
          onClose={() => { setItemModalOpen(false); setEditingIndex(null) }}
          onSave={handleSaveItem}
          item={editingIndex !== null ? form.itens[editingIndex] : null}
          currentType={currentType}
          references={referencias}
          isLoading={carregandoRefs}
        />

        {!canSubmit && (
          <div className="validation-message">
            <AlertCircle size={16} style={{ display: 'inline', marginRight: 8 }} />
            Para enviar, preencha a descrição da condição de saúde e adicione pelo menos um item.
          </div>
        )}
      </form>
    </div>
  )
}
