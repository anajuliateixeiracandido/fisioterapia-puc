import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchCIFReferences } from '../services/cifApi'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

const CATEGORIA_MAP = {
  b: 'FUNCAO',
  s: 'ESTRUTURA',
  d: 'ACTIVIDADE_PARTICIPACAO',
  e: 'FACTOR_AMBIENTAL',
}

function converterRelatorioParaForm(relatorio) {
  // Validação mais rigorosa
  if (!relatorio) {
    console.warn('converterRelatorioParaForm: relatorio é null/undefined')
    return null
  }
  
  if (!relatorio.formularioCIF) {
    console.warn('converterRelatorioParaForm: formularioCIF não encontrado')
    return null
  }

  const { formularioCIF, pacienteId } = relatorio

  try {
    return {
      tipoCIF: formularioCIF.tipoCIF || 'CIF',
      dataPreenchimento: formularioCIF.dataPreenchimento
        ? new Date(formularioCIF.dataPreenchimento).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      pacienteId: pacienteId?.toString() || '',
      condicaoSaude: formularioCIF.condicaoSaude || '',
      condicaoSaudeDescricao: formularioCIF.condicaoSaudeDescricao || '',
      factoresPessoais: formularioCIF.factoresPessoais || '',
      planoTerapeutico: formularioCIF.planoTerapeutico || '',
      itens: (formularioCIF.itens || []).map(item => ({
        ...item,
        codigoCIF: item.codigoCIF || item.codigo || '',
        nome: item.nome || item.descricao || '',
        qualificador: item.qualificador?.toString() || '0',
      })),
    }
  } catch (error) {
    console.error('Erro ao converter relatório:', error)
    return null
  }
}

export function useFormularioRelatorioViewModel(relatorioInicial = null, modoEdicao = false) {
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [currentType, setCurrentType] = useState('b')
  const [referencias, setReferencias] = useState([])
  const [carregandoRefs, setCarregandoRefs] = useState(false)
  const [pacientes, setPacientes] = useState([])

  // Estado inicial do formulário
  const formVazio = {
    tipoCIF: 'CIF',
    dataPreenchimento: new Date().toISOString().slice(0, 16),
    pacienteId: '',
    condicaoSaude: '',
    condicaoSaudeDescricao: '',
    factoresPessoais: '',
    planoTerapeutico: '',
    itens: [],
  }

  const formInicial = useMemo(() => {
    if (relatorioInicial && modoEdicao) {
      const convertido = converterRelatorioParaForm(relatorioInicial)
      if (convertido) {
        return convertido
      }
      return formVazio
    }
    return formVazio
  }, [JSON.stringify(relatorioInicial), modoEdicao])

  const [form, setForm] = useState(formInicial)

  // Atualizar form quando formInicial mudar (ex: ao carregar dados para edição)
  useEffect(() => {
    setForm(formInicial)
  }, [formInicial])

  const updateForm = (updates) => setForm(prev => ({ ...prev, ...updates }))
  const updateItens = (itens) => setForm(prev => ({ ...prev, itens }))

  const canSubmit = form.condicaoSaudeDescricao.trim().length > 0
    && form.itens.length > 0
    && !!form.pacienteId

  // Buscar pacientes
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

  const itemsByType = useMemo(() => {
    const grouped = { b: [], s: [], d: [], e: [] }
    form.itens.forEach((item, index) => {
      const prefix = String(item.codigoCIF || '').charAt(0).toLowerCase() || 'b'
      if (grouped[prefix]) grouped[prefix].push({ ...item, globalIndex: index })
    })
    return grouped
  }, [form.itens])

  return {
    // Estado do formulário
    form,
    pacientes,
    canSubmit,
    modoEdicao,
    relatorioInicial,

    // Estado do modal
    itemModalOpen,
    editingIndex,
    currentType,
    referencias,
    carregandoRefs,

    // Dados processados
    itemsByType,

    // Métodos
    updateForm,
    updateItens,
    handleAddItem,
    handleEditItem,
    handleSaveItem,
    handleRemoveItem,
    setItemModalOpen,
    setEditingIndex,
  }
}
