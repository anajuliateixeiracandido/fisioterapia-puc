import React, { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { getPrefixoCIF } from '../../utils/cifRules'
import { CIFItemCard } from './CIFItemCard'
import { CIFItemEditor } from './CIFItemEditor'

const CIF_TYPES = [
  { 
    key: 'b', 
    label: 'Funções do Corpo',
    description: 'Funções fisiológicas dos sistemas do corpo',
    icon: 'b'
  },
  { 
    key: 's', 
    label: 'Estruturas do Corpo',
    description: 'Partes anatômicas do corpo',
    icon: 's'
  },
  { 
    key: 'd', 
    label: 'Atividades e Participação',
    description: 'Execução de tarefas e envolvimento em situações da vida',
    icon: 'd'
  },
  { 
    key: 'e', 
    label: 'Fatores Ambientais',
    description: 'Ambiente físico, social e de atitudes',
    icon: 'e'
  },
]

export function CIFItemsSection({ tipoCIF, items, references, onChange }) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [prefilledItem, setPrefilledItem] = useState(null)
  const [currentType, setCurrentType] = useState('b')

  // Agrupa itens por tipo
  const itemsByType = useMemo(() => {
    const grouped = { b: [], s: [], d: [], e: [] }
    items.forEach((item, index) => {
      const prefix = getPrefixoCIF(item.codigoCIF)
      if (grouped[prefix]) {
        grouped[prefix].push({ ...item, globalIndex: index })
      }
    })
    return grouped
  }, [items])

  function handleNewItem(type) {
    setCurrentType(type)
    setEditingIndex(null)
    setPrefilledItem(null)
    setEditorOpen(true)
  }

  function handleEditItem(globalIndex) {
    const item = items[globalIndex]
    const prefix = getPrefixoCIF(item.codigoCIF)
    setCurrentType(prefix)
    setEditingIndex(globalIndex)
    setPrefilledItem(item)
    setEditorOpen(true)
  }

  function handleSaveItem(item) {
    if (editingIndex === null) {
      onChange([
        ...items,
        { ...item, id: crypto.randomUUID?.() ?? String(Date.now()) },
      ])
    } else {
      const next = [...items]
      next[editingIndex] = item
      onChange(next)
    }

    setEditorOpen(false)
    setEditingIndex(null)
    setPrefilledItem(null)
  }

  function handleRemoveItem(globalIndex) {
    onChange(items.filter((_, index) => index !== globalIndex))
  }

  function handleSuggestFactor(baseItem, tipo) {
    setCurrentType('e')
    setEditingIndex(null)
    setPrefilledItem({
      codigoCIF: '',
      descricao: '',
      tipoQualificador1: tipo,
      itemRelacionadoCodigo: baseItem.codigoCIF,
      observacao: `Sugerido a partir do item ${baseItem.codigoCIF} - ${baseItem.descricao}`,
    })
    setEditorOpen(true)
  }

  return (
    <div className="cif-sections-container">
      {CIF_TYPES.map((type) => {
        const typeItems = itemsByType[type.key]
        
        return (
          <div key={type.key} className={`cif-type-section type-${type.key}`}>
            <div className="cif-type-header">
              <div className="cif-type-title">
                <div className={`cif-type-badge type-${type.key}`}>
                  {type.icon.toUpperCase()}
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
                onClick={() => handleNewItem(type.key)}
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

      <CIFItemEditor
        open={editorOpen}
        tipoCIF={tipoCIF}
        references={references}
        allowedPrefix={currentType}
        relatedItems={items}
        initialValue={prefilledItem}
        onClose={() => {
          setEditorOpen(false)
          setEditingIndex(null)
          setPrefilledItem(null)
        }}
        onSave={handleSaveItem}
        onSuggestFactor={handleSuggestFactor}
      />
    </div>
  )
}
