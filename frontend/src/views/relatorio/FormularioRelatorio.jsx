import React from 'react'
import { FileText, Send, AlertCircle, Plus } from 'lucide-react'
import { FormularioHeaderSection } from './FormularioHeaderSection'
import { CIFItemCard } from './CartaoItemCIF'
import { CIF_TIPOS_ARRAY } from '../../constants/relatorio.constants'
import './FormularioRelatorio.css'
import ModalItemCIF from './ModalItemCIF'
import { useFormularioRelatorioViewModel } from '../../viewmodels/useFormularioRelatorioViewModel'

export function ReportForm({ onSaveDraft, onSubmitReport, relatorioInicial = null, modoEdicao = false }) {
  const {
    form,
    pacientes,
    canSubmit,
    itemModalOpen,
    editingIndex,
    currentType,
    referencias,
    carregandoRefs,
    itemsByType,
    updateForm,
    handleAddItem,
    handleEditItem,
    handleSaveItem,
    handleRemoveItem,
    setItemModalOpen,
    setEditingIndex,
  } = useFormularioRelatorioViewModel(relatorioInicial, modoEdicao)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return

    const dadosEnvio = {
      pacienteId: Number(form.pacienteId),
      tipoCIF: form.tipoCIF,
      dataPreenchimento: form.dataPreenchimento,
      condicaoSaude: form.condicaoSaude,
      condicaoSaudeDescricao: form.condicaoSaudeDescricao,
      factoresPessoais: form.factoresPessoais,
      planoTerapeutico: form.planoTerapeutico,
      itens: Array.isArray(form.itens) ? form.itens : [],
    }

    if (modoEdicao && relatorioInicial?.id) {
      dadosEnvio.relatorioId = relatorioInicial.id
    }

    onSubmitReport?.(dadosEnvio)
  }

  return (
    <div className="report-form-container">
      {modoEdicao && (
        <div className="edit-mode-notice">
          <FileText size={18} />
          <span>Você está editando um relatório existente. Faça as alterações necessárias e clique em "Salvar alterações".</span>
        </div>
      )}
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
                disabled={modoEdicao}
                className={modoEdicao ? 'form-select form-select--disabled' : 'form-select'}
              >
                <option value="">Selecione o paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nomeCompleto}
                  </option>
                ))}
              </select>
              {modoEdicao && (
                <span className="paciente-disabled-note">
                  O paciente não pode ser alterado após a criação do relatório
                </span>
              )}
              {!modoEdicao && pacientes.length === 0 && (
                <span className="pacientes-empty-note">
                  Nenhum paciente encontrado
                </span>
              )}
            </div>
          </div>

          <FormularioHeaderSection value={form} onChange={updateForm} />
        </div>

        <div className="cif-sections-container">
          {CIF_TIPOS_ARRAY.map((type) => {
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
            <Send size={18} /> {modoEdicao ? 'Salvar alterações' : 'Enviar relatório'}
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