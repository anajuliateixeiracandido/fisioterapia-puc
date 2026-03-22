import React from 'react'
import './FormularioHeaderSection.css'

/**
 * Seção de cabeçalho do formulário CIF com dados gerais
 */
export function FormularioHeaderSection({ value, onChange }) {
  function patch(key, fieldValue) {
    onChange({ ...value, [key]: fieldValue })
  }

  return (
    <div className="header-section-grid">
      <div className="form-group">
        <label className="form-label">
          Tipo CIF
        </label>
        <select
          className="form-select"
          value={value.tipoCIF}
          onChange={(e) => patch('tipoCIF', e.target.value)}
        >
          <option value="CIF">CIF - Adultos</option>
          <option value="CIF_CJ">CIF-CJ - Crianças e Jovens</option>
        </select>
        {value.tipoCIF === 'CIF_CJ' && (
          <div className="cif-type-badge-header">
            📋 Formulário CIF para Crianças e Jovens
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">
          Data de preenchimento
        </label>
        <input
          type="datetime-local"
          className="form-input"
          value={value.dataPreenchimento}
          onChange={(e) => patch('dataPreenchimento', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Condição de saúde
        </label>
        <input
          className="form-input"
          placeholder="CID, diagnóstico ou texto curto"
          value={value.condicaoSaude ?? ''}
          onChange={(e) => patch('condicaoSaude', e.target.value)}
        />
        <span className="form-help-text">
          Opcional - Ex: CID-10, diagnóstico clínico
        </span>
      </div>

      <div className="form-group full-width">
        <label className="form-label">
          Descrição da condição de saúde
          <span className="required">*</span>
        </label>
        <textarea
          className="form-textarea"
          placeholder="Descrição clínica detalhada da condição..."
          value={value.condicaoSaudeDescricao}
          onChange={(e) => patch('condicaoSaudeDescricao', e.target.value)}
          required
        />
        <span className="form-help-text">
          Obrigatório - Descreva a condição de saúde do paciente
        </span>
      </div>

      <div className="form-group full-width">
        <label className="form-label">
          Fatores pessoais
        </label>
        <textarea
          className="form-textarea"
          placeholder="Ex: motivação, medo, adesão ao tratamento, contexto social..."
          value={value.factoresPessoais ?? ''}
          onChange={(e) => patch('factoresPessoais', e.target.value)}
        />
        <span className="form-help-text">
          Aspectos pessoais que influenciam a condição
        </span>
      </div>

      <div className="form-group full-width">
        <label className="form-label">
          Plano terapêutico
        </label>
        <textarea
          className="form-textarea"
          placeholder="Descreva o plano de tratamento proposto..."
          value={value.planoTerapeutico ?? ''}
          onChange={(e) => patch('planoTerapeutico', e.target.value)}
        />
      </div>

      <div className="form-group full-width">
        <label className="form-label">
          Observações gerais
        </label>
        <textarea
          className="form-textarea"
          placeholder="Informações adicionais relevantes..."
          value={value.observacoes ?? ''}
          onChange={(e) => patch('observacoes', e.target.value)}
        />
      </div>
    </div>
  )
}
