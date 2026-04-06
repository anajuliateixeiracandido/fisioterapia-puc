import React, { createContext, useContext } from 'react'
import Modal from '../views/geral/Modal'
import { useModalViewModel } from '../viewmodels/useModalViewModel'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const modal = useModalViewModel()

  return (
    <ModalContext.Provider value={modal}>
      {children}
      <Modal
        isOpen={modal.isOpen}
        type={modal.config.type}
        title={modal.config.title}
        message={modal.config.message}
        confirmText={modal.config.confirmText}
        cancelText={modal.config.cancelText}
        onConfirm={modal.handleConfirm}
        onCancel={modal.handleCancel}
        onClose={modal.closeModal}
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
