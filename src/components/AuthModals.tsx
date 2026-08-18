import { useState } from 'react'
import { Modal } from './Modal'

interface ForgotPasswordModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (email: string) => void
}

export function ForgotPasswordModal({ open, onCancel, onSubmit }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  if (!open) return null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    onSubmit(email.trim())
  }

  return (
    <Modal open={open} onClose={onCancel} title="¿Olvidaste tu contraseña?" icon="🔑">
      <form className="modal-form" onSubmit={submit}>
        <p className="hint">Escribe el correo del adulto responsable. Te enviaremos un enlace para restablecer la contraseña.</p>
        <label>Correo<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="primary">Enviar enlace</button>
        </div>
      </form>
    </Modal>
  )
}

interface ResetPasswordModalProps {
  open: boolean
  onSubmit: (password: string) => void
  error?: string
}

export function ResetPasswordModal({ open, onSubmit, error }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')
  if (!open) return null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setLocalError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== confirm) { setLocalError('Las contraseñas no coinciden.'); return }
    setLocalError('')
    onSubmit(password)
  }

  return (
    <Modal open={open} title="Restablecer contraseña" icon="🔒">
      <form className="modal-form" onSubmit={submit}>
        <p className="hint">Escribe tu nueva contraseña para la cuenta de Eli Bunny Power.</p>
        <label>Nueva contraseña<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <label>Confirmar contraseña<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required /></label>
        {(localError || error) && <p className="form-error">{localError || error}</p>}
        <div className="modal-actions">
          <button type="submit" className="primary big">Actualizar contraseña</button>
        </div>
      </form>
    </Modal>
  )
}
