import { useState } from 'react'
import { Modal } from './Modal'
import type { Reward } from '../types'

interface RewardFormModalProps {
  open: boolean
  reward?: Reward
  onCancel: () => void
  onSave: (data: { name: string; description: string; level: number; duration: string; frequency: string; active: boolean }) => void
}

export function RewardFormModal({ open, reward, onCancel, onSave }: RewardFormModalProps) {
  const [name, setName] = useState(reward?.name ?? '')
  const [description, setDescription] = useState(reward?.description ?? '')
  const [level, setLevel] = useState(String(reward?.level ?? 1))
  const [duration, setDuration] = useState(reward?.duration ?? '')
  const [frequency, setFrequency] = useState(reward?.frequency ?? '')
  const [active, setActive] = useState(reward?.active ?? true)

  if (!open) return null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim(), level: Number(level), duration: duration.trim(), frequency: frequency.trim(), active })
  }

  return (
    <Modal open={open} onClose={onCancel} title={reward ? 'Editar premio' : 'Nuevo premio'} icon="🎁">
      <form className="modal-form" onSubmit={submit}>
        <label>Nombre<input value={name} onChange={e => setName(e.target.value)} required /></label>
        <label>Descripción<input value={description} onChange={e => setDescription(e.target.value)} /></label>
        <div className="modal-form-row">
          <label>Nivel
            <select value={level} onChange={e => setLevel(e.target.value)}>
              <option value="1">1 · Cute</option>
              <option value="2">2 · Power</option>
              <option value="3">3 · Super Bunny</option>
            </select>
          </label>
          <label>Duración<input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ej. Hasta 2 horas" /></label>
        </div>
        <label>Frecuencia<input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="Ej. 1 vez por semana" /></label>
        <label className="checkbox-row"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Premio activo</label>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="primary">Guardar</button>
        </div>
      </form>
    </Modal>
  )
}
