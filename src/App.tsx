import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase'
import { addEvent, deleteEvent, deleteReward, deleteRule, loadAll, saveReward, saveRule, updateSettings } from './lib/db'
import type { PointEvent, Reward, Rule, Settings } from './types'

const DAY = 86400000

function isoDate(d = new Date()) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function mondayOf(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return isoDate(d)
}

function addDays(dateString: string, days: number) {
  const d = new Date(`${dateString}T12:00:00`)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

function moneyPoints(n: number) {
  return n > 0 ? `+${n}` : `${n}`
}

function levelFor(total: number, s: Settings) {
  if (total >= s.level3_min) return 3
  if (total >= s.level2_min) return 2
  if (total >= s.level1_min) return 1
  return 0
}

function levelName(level: number) {
  return level === 3 ? 'Super Bunny' : level === 2 ? 'Power' : level === 1 ? 'Cute' : 'Sigue esforzándote'
}

function levelEmoji(level: number) {
  return level === 3 ? '🐰✨' : level === 2 ? '⚡🐰' : level === 1 ? '🌸🐰' : '🌱'
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ settings: Settings; rules: Rule[]; rewards: Reward[]; events: PointEvent[] } | null>(null)
  const [tab, setTab] = useState<'panel' | 'puntos' | 'premios' | 'config'>('panel')
  const [toast, setToast] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const localMode = !supabaseConfigured

  async function refresh(userId?: string) {
    setLoading(true)
    try {
      const d = await loadAll(userId)
      setData(d)
    } catch (e: any) {
      setToast(e.message || 'No fue posible cargar los datos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      refresh('local-user')
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) refresh(data.session.user.id)
      else setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) refresh(s.user.id)
      else setData(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const userId = session?.user?.id ?? 'local-user'

  const weekStart = useMemo(() => mondayOf(), [])
  const weekEnd = addDays(weekStart, 6)

  const weekEvents = useMemo(() => {
    if (!data) return []
    return data.events.filter(e => e.event_date >= weekStart && e.event_date <= weekEnd)
  }, [data, weekStart, weekEnd])

  const total = useMemo(() => weekEvents.reduce((a, e) => a + e.points, 0), [weekEvents])
  const level = data ? levelFor(total, data.settings) : 0
  const nextTarget = data ? (level === 0 ? data.settings.level1_min : level === 1 ? data.settings.level2_min : level === 2 ? data.settings.level3_min : total) : 0
  const progress = level === 3 ? 100 : Math.min(100, Math.max(0, (total / Math.max(1, nextTarget)) * 100))

  async function login() {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setToast(error.message)
  }

  async function signup() {
    if (!supabase) return
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setToast(error.message)
    else setToast('Cuenta creada. Revisa tu correo si Supabase solicita confirmación.')
  }

  async function logout() {
    await supabase?.auth.signOut()
  }

  async function record(rule: Rule) {
    if (!data) return
    const points = rule.type === 'earning' ? Math.abs(rule.points) : -Math.abs(rule.points)
    const event = await addEvent(userId, { rule_id: rule.id, event_date: isoDate(), points, note: rule.name })
    setData({ ...data, events: [event, ...data.events] })
    setToast(`${moneyPoints(points)} PA registrados.`)
  }

  async function removeEvent(id: string) {
    if (!data) return
    await deleteEvent(userId, id)
    setData({ ...data, events: data.events.filter(e => e.id !== id) })
    setToast('Registro eliminado.')
  }

  if (supabaseConfigured && !session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="bunny">🐰</div>
          <h1>Eli Bunny Power</h1>
          <p>Panel de autonomía y puntos.</p>
          <div className="auth-tabs">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Entrar</button>
            <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Crear cuenta</button>
          </div>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo del adulto" type="email" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password" />
          <button className="primary big" onClick={authMode === 'login' ? login : signup}>{authMode === 'login' ? 'Entrar al panel' : 'Crear cuenta'}</button>
          <small>La cuenta debe ser del adulto responsable. Eli puede usar el panel desde el dispositivo autorizado.</small>
        </div>
      </div>
    )
  }

  if (loading || !data) return <div className="loading">🐰 Preparando Bunny Power…</div>

  const activeEarnings = data.rules.filter(r => r.active && r.type === 'earning')
  const activePenalties = data.rules.filter(r => r.active && r.type === 'penalty')
  const rewards = data.rewards.filter(r => r.active)
  const levelRewards = rewards.filter(r => r.level <= Math.max(level, 1))

  async function saveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const patch = {
      child_name: String(fd.get('child_name')),
      level1_min: Number(fd.get('level1_min')),
      level1_max: Number(fd.get('level1_max')),
      level2_min: Number(fd.get('level2_min')),
      level2_max: Number(fd.get('level2_max')),
      level3_min: Number(fd.get('level3_min')),
    }
    const settings = await updateSettings(userId, patch)
    setData({ ...data, settings })
    setToast('Configuración guardada.')
  }

  async function addOrEditRule(rule?: Rule) {
    const name = window.prompt('Nombre del deber o penalización:', rule?.name ?? '')
    if (!name) return
    const pointsRaw = window.prompt('Puntos (solo número positivo):', String(rule?.points ?? 5))
    const points = Number(pointsRaw)
    if (!points || points < 1) return
    const description = window.prompt('Descripción breve:', rule?.description ?? '') ?? ''
    const type = rule?.type ?? (window.confirm('¿Es una penalización? Aceptar = penalización, Cancelar = deber que suma.') ? 'penalty' : 'earning')
    const saved = await saveRule(userId, { id: rule?.id, name, points, description, type, active: rule?.active ?? true })
    setData({ ...data, rules: rule ? data.rules.map(x => x.id === rule.id ? saved : x) : [...data.rules, saved] })
    setToast('Regla guardada.')
  }

  async function removeRule(id: string) {
    await deleteRule(userId, id)
    setData({ ...data, rules: data.rules.filter(r => r.id !== id) })
  }

  async function addOrEditReward(reward?: Reward) {
    const name = window.prompt('Nombre del premio:', reward?.name ?? '')
    if (!name) return
    const level = Number(window.prompt('Nivel (1 Cute, 2 Power, 3 Super Bunny):', String(reward?.level ?? 1)))
    if (![1, 2, 3].includes(level)) return
    const duration = window.prompt('Duración:', reward?.duration ?? '') ?? ''
    const frequency = window.prompt('Frecuencia semanal:', reward?.frequency ?? '') ?? ''
    const description = window.prompt('Descripción:', reward?.description ?? '') ?? ''
    const saved = await saveReward(userId, { id: reward?.id, level, name, duration, frequency, description, active: reward?.active ?? true })
    setData({ ...data, rewards: reward ? data.rewards.map(x => x.id === reward.id ? saved : x) : [...data.rewards, saved] })
    setToast('Premio guardado.')
  }

  async function removeReward(id: string) {
    await deleteReward(userId, id)
    setData({ ...data, rewards: data.rewards.filter(r => r.id !== id) })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-bunny">🐰</span>
          <div><strong>Eli Bunny Power</strong><small>Mis puntos de autonomía</small></div>
        </div>
        <div className="top-actions">
          <button onClick={() => window.print()}>🖨️ Imprimir</button>
          {supabaseConfigured && <button onClick={logout}>Salir</button>}
        </div>
      </header>

      <nav className="nav">
        <button className={tab === 'panel' ? 'active' : ''} onClick={() => setTab('panel')}>🏠 Panel</button>
        <button className={tab === 'puntos' ? 'active' : ''} onClick={() => setTab('puntos')}>⭐ Registrar puntos</button>
        <button className={tab === 'premios' ? 'active' : ''} onClick={() => setTab('premios')}>🎁 Premios</button>
        <button className={tab === 'config' ? 'active' : ''} onClick={() => setTab('config')}>⚙️ Configuración</button>
      </nav>

      <main className="content">
        <section className="hero-card">
          <div>
            <span className="eyebrow">MISIÓN DE LA SEMANA</span>
            <h1>¡Hola, {data.settings.child_name}! 🐰💜</h1>
            <p>Tu objetivo no es ser perfecta: es aprender a hacer tus cosas <strong>sin que te las recuerden</strong>.</p>
          </div>
          <div className="score-orb">
            <div className="orb-number">{total}</div>
            <div>PA esta semana</div>
          </div>
        </section>

        {tab === 'panel' && (
          <>
            <div className="grid-3">
              <div className={`level-card level-${level}`}>
                <div className="card-label">NIVEL ACTUAL</div>
                <div className="level-title">{levelEmoji(level)} {levelName(level)}</div>
                <p>{level === 0 ? `Necesitas ${nextTarget - total} PA para desbloquear Cute.` : level === 3 ? '¡Todos los niveles desbloqueados!' : `Te faltan ${Math.max(0, nextTarget - total)} PA para el siguiente nivel.`}</p>
              </div>
              <div className="stat-card">
                <span>📅 Semana</span>
                <strong>{weekStart} → {weekEnd}</strong>
                <small>Los puntos se reinician el lunes.</small>
              </div>
              <div className="stat-card">
                <span>🎯 Próximo objetivo</span>
                <strong>{level === 3 ? 'SUPER BUNNY' : `${nextTarget} PA`}</strong>
                <small>Registra cada actividad cuando esté realmente terminada.</small>
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-head"><strong>Progreso hacia el siguiente nivel</strong><span>{total} / {nextTarget || total} PA</span></div>
              <div className="progress"><div style={{ width: `${progress}%` }} /></div>
              <div className="level-scale"><span>🌱 0</span><span>🌸 {data.settings.level1_min}</span><span>⚡ {data.settings.level2_min}</span><span>✨ {data.settings.level3_min}</span></div>
            </div>

            <div className="dashboard-grid">
              <div className="panel">
                <div className="panel-title"><h2>⭐ Hoy puedo ganar</h2><span>Hazlo sin recordatorios</span></div>
                <div className="rule-grid">
                  {activeEarnings.map(r => <button key={r.id} className="rule-button earn" onClick={() => record(r)}><span>＋{r.points}</span><strong>{r.name}</strong><small>{r.description}</small></button>)}
                </div>
              </div>
              <div className="panel danger-panel">
                <div className="panel-title"><h2>🚫 Reglas que restan</h2><span>Primero hablamos, luego registramos</span></div>
                <div className="rule-grid">
                  {activePenalties.map(r => <button key={r.id} className="rule-button penalty" onClick={() => record(r)}><span>−{r.points}</span><strong>{r.name}</strong><small>{r.description}</small></button>)}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title"><h2>🎁 Lo que ya desbloqueaste</h2><span>Nivel {level || 0}</span></div>
              <div className="reward-grid">
                {levelRewards.map(r => <div className={`reward ${r.level === 3 ? 'special' : ''}`} key={r.id}><div className="reward-icon">{r.level === 3 ? '✨' : r.level === 2 ? '⚡' : '🌸'}</div><strong>{r.name}</strong><p>{r.description}</p><b>{r.duration}</b><small>{r.frequency}</small></div>)}
              </div>
            </div>
          </>
        )}

        {tab === 'puntos' && (
          <>
            <div className="panel">
              <div className="panel-title"><h2>⭐ Registrar una actividad</h2><span>Semana actual</span></div>
              <p className="hint">El registro debe hacerse cuando la actividad esté terminada. Los adultos pueden corregir un registro si hubo un error.</p>
              <div className="rule-grid large">
                {activeEarnings.map(r => <button key={r.id} className="rule-button earn" onClick={() => record(r)}><span>＋{r.points}</span><strong>{r.name}</strong><small>{r.description}</small></button>)}
              </div>
            </div>
            <div className="panel danger-panel">
              <div className="panel-title"><h2>🚫 Registrar una penalización</h2><span>Solo por una situación real</span></div>
              <div className="rule-grid large">
                {activePenalties.map(r => <button key={r.id} className="rule-button penalty" onClick={() => record(r)}><span>−{r.points}</span><strong>{r.name}</strong><small>{r.description}</small></button>)}
              </div>
            </div>
            <div className="panel">
              <div className="panel-title"><h2>📒 Historial de la semana</h2><span>{total} PA</span></div>
              <div className="events">
                {weekEvents.length === 0 && <p className="empty">Todavía no hay registros esta semana.</p>}
                {weekEvents.map(e => {
                  const rule = data.rules.find(r => r.id === e.rule_id)
                  return <div className="event" key={e.id}><span>{e.points >= 0 ? '⭐' : '🚫'}</span><div><strong>{rule?.name ?? e.note}</strong><small>{e.event_date}</small></div><b className={e.points >= 0 ? 'positive' : 'negative'}>{moneyPoints(e.points)} PA</b><button onClick={() => removeEvent(e.id)}>×</button></div>
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'premios' && (
          <>
            <div className="levels-overview">
              {[1,2,3].map(n => {
                const min = n === 1 ? data.settings.level1_min : n === 2 ? data.settings.level2_min : data.settings.level3_min
                const max = n === 1 ? data.settings.level1_max : n === 2 ? data.settings.level2_max : null
                return <div className={`level-box ${level >= n ? 'unlocked' : ''}`} key={n}><div>{n === 1 ? '🌸' : n === 2 ? '⚡' : '✨'}</div><strong>{levelName(n)}</strong><span>{min}{max ? `–${max}` : '+'} PA</span>{level >= n && <b>DESBLOQUEADO</b>}</div>
              })}
            </div>
            {[1,2,3].map(n => <div className="panel" key={n}><div className="panel-title"><h2>{levelEmoji(n)} Nivel {levelName(n)}</h2><span>{n === 1 ? `${data.settings.level1_min}–${data.settings.level1_max}` : n === 2 ? `${data.settings.level2_min}–${data.settings.level2_max}` : `${data.settings.level3_min}+`} PA</span></div><div className="reward-grid">{rewards.filter(r => r.level === n).map(r => <div className={`reward ${n === 3 ? 'special' : ''}`} key={r.id}><div className="reward-icon">{n === 3 ? '✨' : n === 2 ? '⚡' : '🌸'}</div><strong>{r.name}</strong><p>{r.description}</p><b>{r.duration}</b><small>{r.frequency}</small></div>)}</div></div>)}
          </>
        )}

        {tab === 'config' && (
          <>
            <form className="panel settings-form" onSubmit={saveSettings}>
              <div className="panel-title"><h2>⚙️ Configuración del sistema</h2><span>Editable por el adulto</span></div>
              <div className="form-grid">
                <label>Nombre de la niña<input name="child_name" defaultValue={data.settings.child_name} /></label>
                <label>Cute mínimo<input name="level1_min" type="number" defaultValue={data.settings.level1_min} /></label>
                <label>Cute máximo<input name="level1_max" type="number" defaultValue={data.settings.level1_max} /></label>
                <label>Power mínimo<input name="level2_min" type="number" defaultValue={data.settings.level2_min} /></label>
                <label>Power máximo<input name="level2_max" type="number" defaultValue={data.settings.level2_max} /></label>
                <label>Super Bunny mínimo<input name="level3_min" type="number" defaultValue={data.settings.level3_min} /></label>
              </div>
              <button className="primary" type="submit">Guardar rangos</button>
            </form>

            <div className="panel">
              <div className="panel-title"><h2>⭐ Deberes y penalizaciones</h2><button className="primary small" onClick={() => addOrEditRule()}>＋ Nueva regla</button></div>
              <div className="admin-list">{data.rules.map(r => <div className={`admin-row ${r.type}`} key={r.id}><span>{r.type === 'earning' ? '⭐' : '🚫'}</span><div><strong>{r.name}</strong><small>{r.description}</small></div><b>{r.type === 'earning' ? '+' : '−'}{r.points}</b><button onClick={() => addOrEditRule(r)}>Editar</button><button className="danger-text" onClick={() => removeRule(r.id)}>Eliminar</button></div>)}</div>
            </div>

            <div className="panel">
              <div className="panel-title"><h2>🎁 Premios</h2><button className="primary small" onClick={() => addOrEditReward()}>＋ Nuevo premio</button></div>
              <div className="admin-list">{data.rewards.map(r => <div className="admin-row" key={r.id}><span>{r.level === 3 ? '✨' : r.level === 2 ? '⚡' : '🌸'}</span><div><strong>N{r.level} · {r.name}</strong><small>{r.duration} · {r.frequency}</small></div><button onClick={() => addOrEditReward(r)}>Editar</button><button className="danger-text" onClick={() => removeReward(r.id)}>Eliminar</button></div>)}</div>
            </div>

            <div className="panel info-panel">
              <h2>🧠 Reglas de convivencia</h2>
              <ul>
                <li>El sistema premia la autonomía, no la perfección.</li>
                <li>Si hay enfermedad, evento familiar o una circunstancia extraordinaria, el adulto puede no registrar la tarea y no aplicar penalización.</li>
                <li>Los puntos no se arrastran al lunes siguiente: cada semana comienza desde 0.</li>
                <li>Si el total queda por debajo del Nivel Cute, esa semana no se desbloquean privilegios recreativos del sistema.</li>
                <li>YouTube permanece prohibido independientemente del nivel.</li>
              </ul>
            </div>
          </>
        )}
      </main>

      <div className="print-board">
        <div className="print-title">🐰 ELI BUNNY POWER</div>
        <div className="print-sub">Tablero semanal de autonomía · {weekStart} al {weekEnd}</div>
        <div className="print-score">{total} PA</div>
        <div className="print-level">{levelEmoji(level)} {levelName(level)}</div>
        <div className="print-columns">
          <div><h3>⭐ GANO PUNTOS</h3>{activeEarnings.map(r => <p key={r.id}>＋{r.points} · {r.name}</p>)}</div>
          <div><h3>🚫 PIERDO PUNTOS</h3>{activePenalties.map(r => <p key={r.id}>−{r.points} · {r.name}</p>)}</div>
          <div><h3>🎁 NIVELES</h3><p>🌸 Cute: {data.settings.level1_min}–{data.settings.level1_max}</p><p>⚡ Power: {data.settings.level2_min}–{data.settings.level2_max}</p><p>✨ Super Bunny: {data.settings.level3_min}+</p></div>
        </div>
        <div className="print-rules"><strong>REGLA DE ORO:</strong> YouTube está prohibido. Los puntos se ganan haciendo las cosas sin recordatorios.</div>
        <div className="print-days">{['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'].map((d,i)=><div key={d}><b>{d}</b><span>{weekEvents.filter(e => e.event_date === addDays(weekStart,i)).reduce((a,e)=>a+e.points,0)} PA</span><i>____________</i></div>)}</div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App