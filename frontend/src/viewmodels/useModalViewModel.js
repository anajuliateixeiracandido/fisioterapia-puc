import { useState, useCallback } from 'react'

export function useModalViewModel() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({
    type: 'info', // 'info', 'success', 'error', 'warning', 'confirm'
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancelar',
    onConfirm: null,
    onCancel: null,
  })

  const openModal = useCallback((modalConfig) => {
    setConfig({
      type: modalConfig.type || 'info',
      title: modalConfig.title || '',
      message: modalConfig.message || '',
      confirmText: modalConfig.confirmText || 'OK',
      cancelText: modalConfig.cancelText || 'Cancelar',
      onConfirm: modalConfig.onConfirm || null,
      onCancel: modalConfig.onCancel || null,
    })
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    // Limpar callbacks após fechar para evitar memory leaks
    setTimeout(() => {
      setConfig(prev => ({
        ...prev,
        onConfirm: null,
        onCancel: null,
      }))
    }, 300) // Aguarda animação de fechamento
  }, [])

  const handleConfirm = useCallback(() => {
    if (config.onConfirm) {
      config.onConfirm()
    }
    closeModal()
  }, [config, closeModal])

  const handleCancel = useCallback(() => {
    if (config.onCancel) {
      config.onCancel()
    }
    closeModal()
  }, [config, closeModal])

  // Métodos auxiliares para tipos comuns
  const showInfo = useCallback((message, title = 'Informação') => {
    openModal({ type: 'info', title, message })
  }, [openModal])

  const showSuccess = useCallback((message, title = 'Sucesso') => {
    openModal({ type: 'success', title, message })
  }, [openModal])

  const showError = useCallback((message, title = 'Erro') => {
    openModal({ type: 'error', title, message })
  }, [openModal])

  const showWarning = useCallback((message, title = 'Atenção') => {
    openModal({ type: 'warning', title, message })
  }, [openModal])

  const showConfirm = useCallback((message, title = 'Confirmação') => {
    return new Promise((resolve) => {
      openModal({
        type: 'confirm',
        title,
        message,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
      })
    })
  }, [openModal])

  return {
    isOpen,
    config,
    openModal,
    closeModal,
    handleConfirm,
    handleCancel,
    showInfo,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
  }
}
