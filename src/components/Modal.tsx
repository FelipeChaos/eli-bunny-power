import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose?: () => void
  title: string
  children?: ReactNode
  icon?: string
  variant?: 'default' | 'success' | 'error'
  actions?: ReactNode
}

export function Modal({ open, onClose, title, children, icon, variant = 'default', actions }: ModalProps) {
  if (!open) return null
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className={`modal-card modal-${variant}`} onClick={e => e.stopPropagation()}>
        {icon && <div className="modal-icon" aria-hidden="true">{icon}</div>}
        <h2>{title}</h2>
        {children && <div className="modal-body">{children}</div>}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}

interface SuccessModalProps {
  open: boolean
  title: string
  message: ReactNode
  onClose: () => void
  buttonLabel?: string
}

export function SuccessModal({ open, title, message, onClose, buttonLabel = 'Entendido' }: SuccessModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon="🐰💜"
      variant="success"
      actions={<button className="primary big" onClick={onClose}>{buttonLabel}</button>}
    >
      {message}
    </Modal>
  )
}

interface ErrorModalProps {
  open: boolean
  title?: string
  message: ReactNode
  onClose: () => void
}

export function ErrorModal({ open, title = 'Algo no salió bien', message, onClose }: ErrorModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon="⚠️"
      variant="error"
      actions={<button className="primary big" onClick={onClose}>Entendido</button>}
    >
      {message}
    </Modal>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel, danger }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      icon={danger ? '🚫' : '❓'}
      variant={danger ? 'error' : 'default'}
      actions={
        <>
          <button className="ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={danger ? 'primary danger-btn' : 'primary'} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      {message}
    </Modal>
  )
}
