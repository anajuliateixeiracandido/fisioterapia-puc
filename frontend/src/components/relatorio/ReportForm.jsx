import React, { useMemo, useState } from 'react'
import { FileText, Save, Send, AlertCircle } from 'lucide-react'
import { FormularioHeaderSection } from './FormularioHeaderSection'
import { CIFItemsSection } from './CIFItemsSection'
import { ReviewPanel } from './ReviewPanel'
import { validateItem } from '../../utils/cifRules'
import { toBackendPayload } from '../../utils/toBackendPayload'
import './ReportForm.css'

function nowToDatetimeLocal() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

const initialForm = {
  tipoCIF: 'CIF',
  dataPreenchimento: nowToDatetimeLocal(),
  condicaoSaude: '',
  condicaoSaudeDescricao: '',
  factoresPessoais: '',
  planoTerapeutico: '',
  observacoes: '',
  itens: [],
}

/**
 * Formulário completo de relatório CIF
 * @param {object} props
 * @param {Array} props.references - Referências CIF disponíveis
 * @param {function} props.onSaveDraft - Callback para salvar rascunho
 * @param {function} props.onSubmitReport - Callback para enviar relatório
 */
export function ReportForm({
  references,
  onSaveDraft,
  onSubmitReport,
}) {
  const [form, setForm] = useState(initialForm)

  const incompleteItems = useMemo(() => {
    return form.itens.filter((item) => validateItem(item).length > 0)
  }, [form.itens])

  const canSubmit =
    form.condicaoSaudeDescricao.trim().length > 0 &&
    form.itens.length > 0 &&
    incompleteItems.length === 0

  function handleSaveDraft() {
    const payload = toBackendPayload(form)
    onSaveDraft?.(payload)
    console.log('RASCUNHO', payload)
  }

  function handleSubmit() {
    if (!canSubmit) return
    const payload = toBackendPayload(form)
    onSubmitReport?.(payload)
    console.log('ENVIAR RELATÓRIO', payload)
  }

  return (
    <div className="report-form-container">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
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
          <FormularioHeaderSection value={form} onChange={setForm} />
        </div>

        {/* Bloco 2 - Itens CIF por Tipo */}
        <CIFItemsSection
          tipoCIF={form.tipoCIF}
          items={form.itens}
          references={references}
          onChange={(itens) => setForm((prev) => ({ ...prev, itens }))}
        />

        {/* Bloco 3 - Revisão */}
        <div className="form-section">
          <ReviewPanel items={form.itens} />
        </div>

        {/* Ações */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
            <Save size={18} />
            Salvar rascunho
          </button>

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
