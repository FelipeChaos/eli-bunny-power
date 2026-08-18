import { useState } from 'react'
import { Modal } from './Modal'
import type { Rule, RuleType } from '../types'

interface RuleFormModalProps {
  open: boolean
  rule?: Rule
  onCancel: () => void
  onSave: (data: { name: string; description: string; points: number; type: RuleType; active: boolean; frequency_label: string; max_per_day: number | null; max_per_week: number | null; school_days_only: boolean }) => void
}

export function RuleFormModal({ open, rule, onCancel, onSave }: RuleFormModalProps) {
  const [name, setName] = useState(rule?.name ?? '')
  const [description, setDescription] = useState(rule?.description ?? '')
  const [points, setPoints] = useState(String(rule?.points ?? 5))
  const [type, setType] = useState<RuleType>(rule?.type ?? 'earning')
  const [active, setActive] = useState(rule?.active ?? true)
  const [frequencyLabel, setFrequencyLabel] = useState(rule?.frequency_label ?? 'Cualquier día')
  const [maxPerDay, setMaxPerDay] = useState(rule?.max_per_day != null ? String(rule.max_per_day) : '')
  const [maxPerWeek, setMaxPerWeek] = useState(rule?.max_per_week != null ? String(rule.max_per_week) : '')
  const [schoolDaysOnly, setSchoolDaysOnly] = useState(rule?.school_days_only ?? false)

  if (!open) return null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const p = Number(points)
    if (!name.trim() || !p || p < 1) return
    onSave({
      name: name.trim(),
      description: description.trim(),
      points: p,
      type,
      active,
      frequency_label: frequencyLabel.trim() || 'Cualquier día',
      max_per_day: maxPerDay ? Number(maxPerDay) : null,
      max_per_week: maxPerWeek ? Number(maxPerWeek) : null,
      school_days_only: schoolDaysOnly,
    })
  }

  return (
    <Modal open={open} onClose={onCancel} title={rule ? 'Editar regla' : 'Nueva regla'} icon="⭐">
      <form className="modal-form" onSubmit={submit}>
        <label>Nombre<input value={name} onChange={e => setName(e.target.value)} required /></label>
        <label>Descripción<input value={description} onChange={e => setDescription(e.target.value)} /></label>
        <div className="modal-form-row">
          <label>Puntos<input type="number" min={1} value={points} onChange={e => setPoints(e.target.value)} required /></label>
          <label>Tipo
            <select value={type} onChange={e => setType(e.target.value as RuleType)}>
              <option value="earning">Suma puntos</option>
              <option value="penalty">Resta puntos</option>
            </select>
          </label>
        </div>
        <label>Frecuencia (texto visible)<input value={frequencyLabel} onChange={e => setFrequencyLabel(e.target.value)} /></label>
        <div className="modal-form-row">
          <label>Máximo por día<input type="number" min={1} value={maxPerDay} onChange={e => setMaxPerDay(e.target.value)} placeholder="Sin límite" /></label>
          <label>Máximo por semana<input type="number" min={1} value={maxPerWeek} onChange={e => setMaxPerWeek(e.target.value)} placeholder="Sin límite" /></label>
        </div>
        <label className="checkbox-row"><input type="checkbox" checked={schoolDaysOnly} onChange={e => setSchoolDaysOnly(e.target.checked)} /> Solo días de colegio</label>
        <label className="checkbox-row"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Regla activa</label>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="primary">Guardar</button>
        </div>
      </form>
    </Modal>
  )
}
