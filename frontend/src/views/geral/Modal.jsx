import React, { useEffect } from 'react'
import { X, AlertCircle, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import './Modal.css'

const ICON_MAP = {
  info: Info,
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  confirm: AlertCircle,
}

const ICON_COLOR_MAP = {
  info: '#3b82f6',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  confirm: '#3b82f6',
}

export function Modal({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  onClose,
}) {
  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const Icon = ICON_MAP[type]
  const iconColor = ICON_COLOR_MAP[type]
  const showCancel = type === 'confirm'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="modal-content">
          <div className="modal-icon" style={{ color: iconColor }}>
            <Icon size={48} />
          </div>

          {title && <h2 className="modal-title">{title}</h2>}

          {message && (
            <div className="modal-message">
              {typeof message === 'string' ? (
                <p>{message}</p>
              ) : (
                message
              )}
            </div>
          )}

          <div className="modal-actions">
            {showCancel && (
              <button
                type="button"
                className="modal-btn modal-btn--secondary"
                onClick={onCancel}
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              className={`modal-btn modal-btn--primary modal-btn--${type}`}
              onClick={onConfirm}
              autoFocus
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal
