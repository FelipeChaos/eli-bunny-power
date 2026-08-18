import { useState } from 'react'
import { Modal } from './Modal'

const REASONS = [
  'Enfermedad',
  'Evento familiar',
  'Viaje',
  'Situación escolar extraordinaria',
  'Otra circunstancia autorizada por adulto',
]

interface SpecialSituationModalProps {
  open: boolean
  onCancel: () => void
  onSave: (reason: string) => void
}

export function SpecialSituationModal({ open, onCancel, onSave }: SpecialSituationModalProps) {
  const [reason, setReason] = useState(REASONS[0])
  const [other, setOther] = useState('')

  if (!open) return null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const finalReason = reason === REASONS[REASONS.length - 1] && other.trim() ? other.trim() : reason
    onSave(finalReason)
  }

  return (
    <Modal open={open} onClose={onCancel} title="Marcar situación especial" icon="🩹">
      <form className="modal-form" onSubmit={submit}>
        <p className="hint">Una situación especial no suma ni resta puntos, y evita penalizaciones automáticas del día. Queda registrada en el historial.</p>
        <label>Motivo
          <select value={reason} onChange={e => setReason(e.target.value)}>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        {reason === REASONS[REASONS.length - 1] && (
          <label>Detalle<input value={other} onChange={e => setOther(e.target.value)} placeholder="Describe la circunstancia" /></label>
        )}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="primary">Registrar situación</button>
        </div>
      </form>
    </Modal>
  )
}
