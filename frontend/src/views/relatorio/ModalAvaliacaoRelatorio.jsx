import React, { useState, useEffect } from 'react'
import { AlertCircle, Send } from 'lucide-react'
import './ModalAvaliacaoRelatorio.css'

export function ModalAvaliacaoRelatorio({ isOpen, onClose, relatorio, onSubmit, isLoading = false }) {
  const [feedback, setFeedback] = useState('')
  const [novoStatus, setNovoStatus] = useState('APROVADO')
  const [errors, setErrors] = useState({})

  // Resetar formulário quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setFeedback('')
      setNovoStatus('APROVADO')
      setErrors({})
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const novoErrors = {}

    if (!feedback.trim()) {
      novoErrors.feedback = 'Feedback é obrigatório'
    }

    if (novoStatus === 'NEGADO' && (!feedback.trim() || feedback.trim().length < 10)) {
      novoErrors.feedback = 'Feedback deve ter pelo menos 10 caracteres quando negando'
    }

    if (Object.keys(novoErrors).length > 0) {
      setErrors(novoErrors)
      return
    }

    onSubmit({
      status: novoStatus,
      feedback: feedback.trim(),
    })

    // Limpar após envio
    setFeedback('')
    setNovoStatus('APROVADO')
    setErrors({})
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-avaliacao" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Avaliar Relatório</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-relatorio">
              <p><strong>Paciente:</strong> {relatorio?.paciente?.nomeCompleto}</p>
              <p><strong>Fisioterapeuta:</strong> {relatorio?.fisioterapeuta?.nomeCompleto}</p>
              <p><strong>Status atual:</strong> 
                <span className={`status-badge status-badge--${relatorio?.status?.toLowerCase()}`}>
                  {relatorio?.status}
                </span>
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Novo Status <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="form-select"
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value)}
                disabled={isLoading}
              >
                <option value="APROVADO">✓ Aprovado</option>
                <option value="NEGADO">✗ Negado</option>
              </select>
              <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                Aprove ou negue o relatório
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                Feedback <span style={{ color: '#ef4444' }}>*</span>
                {novoStatus === 'NEGADO' && <small style={{ color: '#dc2626' }}> (mínimo 10 caracteres)</small>}
              </label>
              <textarea
                className={`form-textarea ${errors.feedback ? 'form-textarea--error' : ''}`}
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value)
                  if (errors.feedback) {
                    setErrors({ ...errors, feedback: '' })
                  }
                }}
                placeholder="Digite seu feedback..."
                rows={5}
                disabled={isLoading}
                maxLength={1000}
              />
              {errors.feedback && (
                <div className="form-error">
                  <AlertCircle size={16} />
                  {errors.feedback}
                </div>
              )}
              <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                {feedback.length}/1000 caracteres
              </small>
            </div>

            {novoStatus === 'APROVADO' && (
              <div style={{
                padding: '0.75rem',
                background: '#dcfce7',
                border: '1px solid #86efac',
                borderRadius: '0.375rem',
                color: '#166534',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>✓</span>
                <span>O relatório será marcado como aprovado com data de hoje</span>
              </div>
            )}

            {novoStatus === 'NEGADO' && (
              <div style={{
                padding: '0.75rem',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '0.375rem',
                color: '#991b1b',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>✗</span>
                <span>O relatório será rejeitado. O fisioterapeuta receberá o feedback</span>
              </div>
            )}

            {novoStatus === 'CORRIGIDO' && (
              <div style={{
                padding: '0.75rem',
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '0.375rem',
                color: '#92400e',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>↻</span>
                <span>O relatório será devolvido para correção</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              <Send size={18} />
              {isLoading ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
