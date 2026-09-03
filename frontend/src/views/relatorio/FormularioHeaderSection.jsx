import React from 'react'
import './FormularioHeaderSection.css'

export function FormularioHeaderSection({ value, onChange }) {
  function patch(key, fieldValue) {
    onChange({ [key]: fieldValue })
  }

  return (
    <div className="header-section-grid">

      {/* ── 1. Instrumento ───────────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label">Tipo CIF</label>
        <select
          className="form-select"
          value={value.tipoCIF}
          onChange={(e) => patch('tipoCIF', e.target.value)}
        >
          <option value="CIF">CIF - Adultos</option>
          <option value="CIF_CJ">CIF-CJ - Crianças e Jovens</option>
        </select>
      </div>

      {/* ── 2. Condição de saúde ─────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label">Condição de saúde</label>
        <input
          className="form-input"
          placeholder="Ex: G20, M54.5"
          value={value.condicaoSaude ?? ''}
          onChange={(e) => patch('condicaoSaude', e.target.value)}
        />
      </div>

      <div className="form-group full-width">
        <label className="form-label">
          Descrição da condição de saúde
          <span className="required">*</span>
        </label>
        <textarea
          className="form-textarea"
          placeholder="Descrição clínica detalhada da condição..."
          value={value.condicaoSaudeDescricao ?? ''}
          onChange={(e) => patch('condicaoSaudeDescricao', e.target.value)}
          required
        />
      </div>

      {/* ── 3. Queixa principal ──────────────────────────────────────────── */}
      <div className="form-group full-width">
        <label className="form-label">Queixa principal</label>
        <textarea
          className="form-textarea"
          placeholder="Descreva a queixa principal relatada pelo paciente ou responsável..."
          value={value.queixaPrincipal ?? ''}
          onChange={(e) => patch('queixaPrincipal', e.target.value)}
          rows={2}
        />
      </div>

      {/* ── 4. Demanda de reabilitação ───────────────────────────────────── */}
      <div className="form-group full-width">
        <label className="form-label">Demanda de reabilitação</label>
        <textarea
          className="form-textarea"
          placeholder="Quais são as expectativas e objetivos do paciente/família com a reabilitação?"
          value={value.demandaReabilitacao ?? ''}
          onChange={(e) => patch('demandaReabilitacao', e.target.value)}
          rows={2}
        />
      </div>

      {/* ── 5. Atividade 1 ───────────────────────────────────────────────── */}
      <div className="form-group full-width">
        <label className="form-label">
          Atividade 1 — Limitação de atividade
          <span className="form-label-hint"> · domínios d1–d6 · perspectiva individual</span>
        </label>
        <textarea
          className="form-textarea"
          placeholder="Descreva a principal atividade funcional que o paciente executa com limitação."
          value={value.atividadeLimitacao ?? ''}
          onChange={(e) => patch('atividadeLimitacao', e.target.value)}
          rows={2}
        />
      </div>

      {/* ── 6. Atividade 2 ───────────────────────────────────────────────── */}
      <div className="form-group full-width">
        <label className="form-label">
          Atividade 2 — Restrição de participação social
          <span className="form-label-hint"> · domínios d7–d9 · perspectiva social</span>
        </label>
        <textarea
          className="form-textarea"
          placeholder="Descreva o impacto na vida social, comunitária ou profissional do paciente."
          value={value.restricaoParticipacao ?? ''}
          onChange={(e) => patch('restricaoParticipacao', e.target.value)}
          rows={2}
        />
      </div>

      {/* ── 7. Fatores pessoais ──────────────────────────────────────────── */}
      <div className="form-group full-width">
        <label className="form-label">Fatores pessoais</label>
        <textarea
          className="form-textarea"
          placeholder="Ex: motivação, medo, adesão ao tratamento, contexto social, estilo de vida..."
          value={value.factoresPessoais ?? ''}
          onChange={(e) => patch('factoresPessoais', e.target.value)}
          rows={2}
        />
      </div>

      {/* ── 8. Condutas ──────────────────────────────────────────────────── */}
      <div className="form-group full-width">
        <label className="form-label">Condutas</label>
        <textarea
          className="form-textarea"
          placeholder="Descreva as condutas fisioterapêuticas a serem aplicadas."
          value={value.planoTerapeutico ?? ''}
          onChange={(e) => patch('planoTerapeutico', e.target.value)}
          rows={3}
        />
      </div>

      {/* ── 9. Diagnóstico fisioterapêutico ─────────────────────────────── */}
      <div className="form-group full-width">
        <label className="form-label">Diagnóstico fisioterapêutico</label>
        <textarea
          className="form-textarea"
          placeholder="Descreva o diagnóstico fisioterapêutico..."
          value={value.diagnosticoFisioterapeutico ?? ''}
          onChange={(e) => patch('diagnosticoFisioterapeutico', e.target.value)}
          rows={2}
        />
      </div>

      {/* ── 10. Objetivos ────────────────────────────────────────────────── */}
      <div className="form-group full-width">
        <label className="form-label">Objetivo de curto prazo</label>
        <textarea
          className="form-textarea"
          placeholder="Descreva o objetivo de curto prazo..."
          value={value.objetivoCurtoPrazo ?? ''}
          onChange={(e) => patch('objetivoCurtoPrazo', e.target.value)}
          rows={2}
        />
      </div>

      <div className="form-group full-width">
        <label className="form-label">Objetivo de longo prazo</label>
        <textarea
          className="form-textarea"
          placeholder="Descreva o objetivo de longo prazo..."
          value={value.objetivoLongoPrazo ?? ''}
          onChange={(e) => patch('objetivoLongoPrazo', e.target.value)}
          rows={2}
        />
      </div>

      {/* ── 11. Observações ──────────────────────────────────────────────── */}
      <div className="form-group full-width">
        <label className="form-label">Observações gerais</label>
        <textarea
          className="form-textarea"
          placeholder="Informações adicionais relevantes para esta avaliação..."
          value={value.observacoes ?? ''}
          onChange={(e) => patch('observacoes', e.target.value)}
          rows={2}
        />
      </div>

    </div>
  )
}