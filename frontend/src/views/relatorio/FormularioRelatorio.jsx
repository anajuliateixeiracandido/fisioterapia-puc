import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { FileText, Send, AlertCircle, Plus } from 'lucide-react'
import { FormularioHeaderSection } from './FormularioHeaderSection'
import { CIFItemCard } from './CartaoItemCIF'
import { obterPrefixoCIF } from '../../utils/regrascif'
import { fetchCIFReferences } from '../../services/cifApi'
import './FormularioRelatorio.css'
import ModalItemCIF from './ModalItemCIF'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

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

function isoParaDataBR(iso) {
  if (!iso) return new Date().toLocaleDateString('pt-BR')
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

export function ReportForm({ onSaveDraft, onSubmitReport }) {
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [currentType, setCurrentType] = useState('b')
  const [referencias, setReferencias] = useState([])
  const [carregandoRefs, setCarregandoRefs] = useState(false)

  const [pacientes, setPacientes] = useState([])

  const [form, setForm] = useState({
    tipoCIF: 'CIF',
    dataPreenchimento: new Date().toISOString().slice(0, 16),
    pacienteId: '',
    condicaoSaude: '',
    condicaoSaudeDescricao: '',
    factoresPessoais: '',
    planoTerapeutico: '',
    observacoes: '',
    itens: [],
  })

  const updateForm = (updates) => setForm(prev => ({ ...prev, ...updates }))
  const updateItens = (itens) => setForm(prev => ({ ...prev, itens }))

  const canSubmit = form.condicaoSaudeDescricao.trim().length > 0
    && form.itens.length > 0
    && !!form.pacienteId 

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    fetch(`${API_BASE}/pacientes`, { headers })
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setPacientes(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => setPacientes([]))
  }, [])

  const abrirModal = useCallback(async (type, globalIndex = null) => {
    setCarregandoRefs(true)
    setReferencias([])
    try {
      const data = await fetchCIFReferences(
        CATEGORIA_MAP[type], undefined, 2000, 0, form.tipoCIF
      )
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
      updateItens(form.itens.filter((_, i) => i !== globalIndex))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return

    onSubmitReport?.({
      ...form,
      pacienteId: Number(form.pacienteId),
      dataPreenchimento: isoParaDataBR(form.dataPreenchimento),
    })
  }
  const itemsByType = useMemo(() => {
    const grouped = { b: [], s: [], d: [], e: [] }
    form.itens.forEach((item, index) => {
      const prefix = obterPrefixoCIF(item.codigoCIF)
      if (grouped[prefix]) grouped[prefix].push({ ...item, globalIndex: index })
    })
    return grouped
  }, [form.itens])

  return (
    <div className="report-form-container">
      <form onSubmit={handleSubmit}>

        <div className="form-section">
          <div className="section-title">
            <div className="section-icon"><FileText size={18} /></div>
            Dados Gerais do Relatório
          </div>

          <div className="form-row-dois">

            <div className="form-field">
              <label className="form-label">
                Paciente <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="form-select"
                value={form.pacienteId}
                onChange={(e) => updateForm({ pacienteId: e.target.value })}
                required
              >
                <option value="">Selecione o paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nomeCompleto}
                  </option>
                ))}
              </select>
              {pacientes.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Nenhum paciente encontrado
                </span>
              )}
            </div>
          </div>

          <FormularioHeaderSection value={form} onChange={updateForm} />
        </div>

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
                    <Plus size={16} /> Adicionar item
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

        <div className="form-actions">
          {!canSubmit && (
            <div className="validation-message">
              <AlertCircle size={16} />
              Selecione um paciente, preencha a condição de saúde e adicione pelo menos um item.
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            <Send size={18} /> Enviar relatório
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
      </form>
    </div>
  )
}