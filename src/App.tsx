import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase'
import { getAppUrl } from './lib/url'
import { addEvent, deleteEvent, deleteReward, deleteRule, loadAll, saveReward, saveRule, updateSettings } from './lib/db'
import type { PointEvent, Reward, Rule, RuleType, Settings } from './types'
import { Bunny } from './components/Bunny'
import { Modal, SuccessModal, ErrorModal, ConfirmDialog } from './components/Modal'
import { RuleFormModal } from './components/RuleFormModal'
import { RewardFormModal } from './components/RewardFormModal'
import { SpecialSituationModal } from './components/SpecialSituationModal'
import { ForgotPasswordModal, ResetPasswordModal } from './components/AuthModals'

const GENERAL_RULES = [
  'El tiempo de uso de las pantallas será habilitado mediante la aplicación de control parental actual.',
  'Las actividades a que dan lugar los puntos de la semana anterior pueden tomar lugar únicamente en tiempo libre, es decir, que todos los deberes del día deben estar realizados.',
  'La hora de ir a dormir es 7:30 pm máximo.',
  'Las salidas fuera del municipio se reservan para el fin de semana (sábado o domingo) y los deberes de la semana en curso deben estar realizados para poder llevar a cabo la salida solicitada.',
]

function isoDate(d = new Date()) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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

function isSchoolDay(dateString: string) {
  const day = new Date(`${dateString}T12:00:00`).getDay()
  return day >= 1 && day <= 5
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

function levelStatusMessage(total: number, s: Settings) {
  if (total >= s.level3_min) return 'Super Bunny desbloqueado'
  if (total >= s.level2_min) return 'Power desbloqueado'
  if (total >= s.level1_min) return 'Cute desbloqueado'
  return 'Esta semana todavía no desbloqueaste privilegios.'
}

function motivationalMessage(level: number) {
  if (level === 3) return '✨ ¡SUPER BUNNY ACTIVADO!'
  if (level === 2) return '⚡ ¡Eli está en Power!'
  if (level === 1) return '🌸 ¡Modo Cute desbloqueado!'
  return '🌱 Sigue construyendo tu autonomía.'
}

interface ConfirmState { open: boolean; title: string; message: ReactNode; onConfirm: () => void; danger?: boolean }
interface ErrorState { open: boolean; title?: string; message: ReactNode }

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ settings: Settings; rules: Rule[]; rewards: Reward[]; events: PointEvent[] } | null>(null)
  const [tab, setTab] = useState<'panel' | 'hoy' | 'semana' | 'historial' | 'premios' | 'config'>('panel')
  const [toast, setToast] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bunnyMood, setBunnyMood] = useState<'idle' | 'celebrate' | 'levelup'>('idle')

  const [signupSuccessOpen, setSignupSuccessOpen] = useState(false)
  const [emailConfirmedOpen, setEmailConfirmedOpen] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetError, setResetError] = useState('')
  const [passwordUpdatedOpen, setPasswordUpdatedOpen] = useState(false)
  const [specialOpen, setSpecialOpen] = useState(false)

  const [ruleFormOpen, setRuleFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined)
  const [rewardFormOpen, setRewardFormOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | undefined>(undefined)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({ open: false, title: '', message: '', onConfirm: () => {} })
  const [errorModal, setErrorModal] = useState<ErrorState>({ open: false, message: '' })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [slowLoad, setSlowLoad] = useState(false)

  // Evita cargas duplicadas/concurrentes para el mismo usuario (getSession + onAuthStateChange pueden dispararse casi a la vez).
  const loadingUserRef = useRef<string | null>(null)

  async function loadUserData(userId: string) {
    if (loadingUserRef.current === userId) return
    loadingUserRef.current = userId
    setLoading(true)
    setLoadError(null)
    if (import.meta.env.DEV) console.log('[DATA] iniciando carga')
    try {
      const d = await loadAll(userId)
      if (import.meta.env.DEV) console.log('[DATA] carga completada')
      setData(d)
    } catch (e: any) {
      if (import.meta.env.DEV) console.error('[DATA] error de carga', e)
      setLoadError(e?.message || 'No pudimos cargar los datos de Bunny Power.')
    } finally {
      setLoading(false)
      loadingUserRef.current = null
    }
  }

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      void loadUserData('local-user')
      return
    }
    const hash = window.location.hash
    if (hash.includes('type=signup')) {
      setEmailConfirmedOpen(true)
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    supabase.auth.getSession().then(({ data }) => {
      if (import.meta.env.DEV) console.log('[AUTH] sesión detectada', Boolean(data.session))
      setSession(data.session)
      if (data.session?.user?.id) void loadUserData(data.session.user.id)
      else setLoading(false)
    })
    // El callback debe permanecer síncrono y ligero: nunca llamar a Supabase directamente aquí
    // (riesgo de deadlock). La carga de datos se difiere con setTimeout(0).
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') {
        setResetOpen(true)
        return
      }
      setSession(s)
      if (s?.user?.id) {
        const uid = s.user.id
        setTimeout(() => { void loadUserData(uid) }, 0)
      } else {
        setData(null)
        setLoading(false)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!loading) { setSlowLoad(false); return }
    const t = setTimeout(() => setSlowLoad(true), 15000)
    return () => clearTimeout(t)
  }, [loading])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const userId = session?.user?.id ?? 'local-user'

  const weekStart = useMemo(() => mondayOf(), [])
  const weekEnd = addDays(weekStart, 6)
  const today = isoDate()

  const weekEvents = useMemo(() => {
    if (!data) return []
    return data.events.filter(e => e.event_date >= weekStart && e.event_date <= weekEnd)
  }, [data, weekStart, weekEnd])

  const todayEvents = useMemo(() => {
    if (!data) return []
    return data.events.filter(e => e.event_date === today)
  }, [data, today])

  const total = useMemo(() => weekEvents.reduce((a, e) => a + e.points, 0), [weekEvents])
  const todayEarned = useMemo(() => todayEvents.filter(e => e.points > 0).reduce((a, e) => a + e.points, 0), [todayEvents])
  const todayLost = useMemo(() => todayEvents.filter(e => e.points < 0).reduce((a, e) => a + Math.abs(e.points), 0), [todayEvents])
  const historicalTotal = useMemo(() => data ? data.events.reduce((a, e) => a + e.points, 0) : 0, [data])

  const level = data ? levelFor(total, data.settings) : 0
  const nextTarget = data ? (level === 0 ? data.settings.level1_min : level === 1 ? data.settings.level2_min : level === 2 ? data.settings.level3_min : total) : 0
  const progress = level === 3 ? 100 : Math.min(100, Math.max(0, (total / Math.max(1, nextTarget)) * 100))

  const prevLevelRef = useRef(level)
  useEffect(() => {
    if (level > prevLevelRef.current) {
      setBunnyMood('levelup')
      setToast(`¡Subiste de nivel! ${levelEmoji(level)} ${levelName(level)}`)
      const t = setTimeout(() => setBunnyMood('idle'), 2600)
      prevLevelRef.current = level
      return () => clearTimeout(t)
    }
    prevLevelRef.current = level
  }, [level])

  function triggerCelebration() {
    setBunnyMood('celebrate')
    setTimeout(() => setBunnyMood(m => (m === 'celebrate' ? 'idle' : m)), 1400)
  }

  const weeklyGroups = useMemo(() => {
    if (!data) return []
    const map = new Map<string, PointEvent[]>()
    for (const e of data.events) {
      const key = mondayOf(new Date(`${e.event_date}T12:00:00`))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return Array.from(map.entries())
      .map(([start, events]) => {
        const wTotal = events.reduce((a, e) => a + e.points, 0)
        return { start, end: addDays(start, 6), events, total: wTotal, level: levelFor(wTotal, data.settings) }
      })
      .sort((a, b) => b.start.localeCompare(a.start))
  }, [data])

  async function login() {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrorModal({ open: true, title: 'No se pudo iniciar sesión', message: error.message })
  }

  async function signup() {
    if (!supabase) return
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: getAppUrl() } })
    if (error) setErrorModal({ open: true, title: 'No se pudo crear la cuenta', message: error.message })
    else setSignupSuccessOpen(true)
  }

  async function logout() {
    await supabase?.auth.signOut()
  }

  async function requestPasswordReset(resetEmail: string) {
    setForgotOpen(false)
    if (!supabase) return
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: getAppUrl() })
    if (error) setErrorModal({ open: true, title: 'No se pudo enviar el correo', message: error.message })
    else setToast('Te enviamos un correo con instrucciones para restablecer tu contraseña.')
  }

  async function updatePassword(newPassword: string) {
    if (!supabase) return
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setResetError(error.message); return }
    setResetError('')
    setResetOpen(false)
    setPasswordUpdatedOpen(true)
    await supabase.auth.signOut()
  }

  function countToday(ruleId: string) {
    return data ? data.events.filter(e => e.rule_id === ruleId && e.event_date === today).length : 0
  }

  function countThisWeek(ruleId: string) {
    return weekEvents.filter(e => e.rule_id === ruleId).length
  }

  async function doRecord(rule: Rule) {
    if (!data) return
    const points = rule.type === 'earning' ? Math.abs(rule.points) : -Math.abs(rule.points)
    const event = await addEvent(userId, {
      rule_id: rule.id,
      event_date: today,
      event_time: nowTime(),
      points,
      note: rule.name,
      type: rule.type,
      created_by: 'adult',
      special: false,
      special_reason: null,
    })
    setData({ ...data, events: [event, ...data.events] })
    setToast(`${moneyPoints(points)} PA registrados.`)
    if (points > 0) triggerCelebration()
  }

  function attemptRecord(rule: Rule) {
    if (!data) return
    if (rule.school_days_only && !isSchoolDay(today)) {
      setErrorModal({ open: true, title: 'No disponible hoy', message: `"${rule.name}" solo aplica en días de colegio.` })
      return
    }
    if (rule.max_per_day != null && countToday(rule.id) >= rule.max_per_day) {
      setErrorModal({ open: true, title: 'Límite alcanzado', message: `"${rule.name}" ya se registró el máximo permitido hoy (${rule.max_per_day}).` })
      return
    }
    if (rule.max_per_week != null && countThisWeek(rule.id) >= rule.max_per_week) {
      setErrorModal({ open: true, title: 'Límite alcanzado', message: `"${rule.name}" ya se registró el máximo permitido esta semana (${rule.max_per_week}).` })
      return
    }
    if (rule.type === 'penalty') {
      setConfirmDialog({
        open: true,
        title: 'Registrar penalización',
        message: `¿Confirmas registrar "${rule.name}" (${moneyPoints(-Math.abs(rule.points))} PA)?`,
        danger: true,
        onConfirm: () => { setConfirmDialog(c => ({ ...c, open: false })); doRecord(rule) },
      })
    } else {
      doRecord(rule)
    }
  }

  async function removeEvent(id: string) {
    if (!data) return
    setConfirmDialog({
      open: true,
      title: 'Eliminar registro',
      message: '¿Eliminar este registro del historial?',
      danger: true,
      onConfirm: async () => {
        await deleteEvent(userId, id)
        setData(prev => prev ? { ...prev, events: prev.events.filter(e => e.id !== id) } : prev)
        setConfirmDialog(c => ({ ...c, open: false }))
        setToast('Registro eliminado.')
      },
    })
  }

  async function recordSpecial(reason: string) {
    if (!data) return
    const event = await addEvent(userId, {
      rule_id: null,
      event_date: today,
      event_time: nowTime(),
      points: 0,
      note: reason,
      type: 'earning',
      created_by: 'adult',
      special: true,
      special_reason: reason,
    })
    setData({ ...data, events: [event, ...data.events] })
    setSpecialOpen(false)
    setToast('Situación especial registrada.')
  }

  const authModals = (
    <>
      <SuccessModal
        open={signupSuccessOpen}
        title="Cuenta creada correctamente"
        message={<><p>Te hemos enviado un correo electrónico para confirmar tu cuenta.</p><p>Revisa tu bandeja de entrada y también Spam.</p></>}
        onClose={() => setSignupSuccessOpen(false)}
      />
      <SuccessModal
        open={emailConfirmedOpen}
        title="¡Correo confirmado!"
        message={<p>Tu cuenta de Eli Bunny Power está lista.</p>}
        onClose={() => setEmailConfirmedOpen(false)}
        buttonLabel="Continuar"
      />
      <SuccessModal
        open={passwordUpdatedOpen}
        title="Contraseña actualizada correctamente"
        message={<p>Ya puedes iniciar sesión con tu nueva contraseña.</p>}
        onClose={() => setPasswordUpdatedOpen(false)}
      />
      <ForgotPasswordModal open={forgotOpen} onCancel={() => setForgotOpen(false)} onSubmit={requestPasswordReset} />
      <ResetPasswordModal open={resetOpen} onSubmit={updatePassword} error={resetError} />
      <ErrorModal open={errorModal.open} title={errorModal.title} message={errorModal.message} onClose={() => setErrorModal({ open: false, message: '' })} />
    </>
  )

  if (supabaseConfigured && !session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Bunny mood="idle" size={60} />
          <h1>Eli Bunny Power</h1>
          <p>Panel de autonomía y puntos.</p>
          <div className="auth-tabs">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Entrar</button>
            <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Crear cuenta</button>
          </div>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo del adulto" type="email" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password" />
          <button className="primary big" onClick={authMode === 'login' ? login : signup}>{authMode === 'login' ? 'Entrar al panel' : 'Crear cuenta'}</button>
          {authMode === 'login' && <button className="link-btn" onClick={() => setForgotOpen(true)}>¿Olvidaste tu contraseña?</button>}
          <small>La cuenta debe ser del adulto responsable. Eli puede usar el panel desde el dispositivo autorizado.</small>
        </div>

        {authModals}
        {toast && <div className="toast">{toast}</div>}
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="loading">
        🐰 Preparando Bunny Power…
        {authModals}
        <Modal
          open={Boolean(loadError)}
          title="No pudimos cargar los datos de Bunny Power."
          icon="⚠️"
          variant="error"
          actions={<button className="primary big" onClick={() => void loadUserData(userId)}>Reintentar</button>}
        >
          <p>Verifica tu conexión e inténtalo nuevamente.</p>
        </Modal>
        <Modal
          open={slowLoad && loading && !loadError}
          title="Estamos tardando más de lo esperado."
          icon="⏳"
          variant="error"
          actions={
            <>
              <button className="ghost" onClick={() => void loadUserData(userId)}>Reintentar</button>
              <button className="primary big" onClick={logout}>Salir</button>
            </>
          }
        >
          <p>La carga de datos está tomando más tiempo del habitual.</p>
        </Modal>
      </div>
    )
  }

  const activeEarnings = data.rules.filter(r => r.active && r.type === 'earning')
  const activePenalties = data.rules.filter(r => r.active && r.type === 'penalty')
  const rewards = data.rewards.filter(r => r.active)
  const levelRewards = rewards.filter(r => r.level <= Math.max(level, 1))
  const recentEvents = data.events.slice(0, 6)

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
    setData(prev => prev ? { ...prev, settings } : prev)
    setToast('Configuración guardada.')
  }

  function openNewRule() { setEditingRule(undefined); setRuleFormOpen(true) }
  function openEditRule(rule: Rule) { setEditingRule(rule); setRuleFormOpen(true) }

  async function submitRule(payload: { name: string; description: string; points: number; type: RuleType; active: boolean; frequency_label: string; max_per_day: number | null; max_per_week: number | null; school_days_only: boolean }) {
    const saved = await saveRule(userId, { id: editingRule?.id, ...payload })
    setData(prev => {
      if (!prev) return prev
      return { ...prev, rules: editingRule ? prev.rules.map(x => x.id === editingRule.id ? saved : x) : [...prev.rules, saved] }
    })
    setRuleFormOpen(false)
    setToast('Regla guardada.')
  }

  function askRemoveRule(rule: Rule) {
    setConfirmDialog({
      open: true,
      title: 'Eliminar regla',
      message: `¿Eliminar "${rule.name}"? Esta acción no se puede deshacer.`,
      danger: true,
      onConfirm: async () => {
        await deleteRule(userId, rule.id)
        setData(prev => prev ? { ...prev, rules: prev.rules.filter(r => r.id !== rule.id) } : prev)
        setConfirmDialog(c => ({ ...c, open: false }))
        setToast('Regla eliminada.')
      },
    })
  }

  function openNewReward() { setEditingReward(undefined); setRewardFormOpen(true) }
  function openEditReward(reward: Reward) { setEditingReward(reward); setRewardFormOpen(true) }

  async function submitReward(payload: { name: string; description: string; level: number; duration: string; frequency: string; active: boolean }) {
    const saved = await saveReward(userId, { id: editingReward?.id, ...payload })
    setData(prev => {
      if (!prev) return prev
      return { ...prev, rewards: editingReward ? prev.rewards.map(x => x.id === editingReward.id ? saved : x) : [...prev.rewards, saved] }
    })
    setRewardFormOpen(false)
    setToast('Premio guardado.')
  }

  function askRemoveReward(reward: Reward) {
    setConfirmDialog({
      open: true,
      title: 'Eliminar premio',
      message: `¿Eliminar "${reward.name}"? Esta acción no se puede deshacer.`,
      danger: true,
      onConfirm: async () => {
        await deleteReward(userId, reward.id)
        setData(prev => prev ? { ...prev, rewards: prev.rewards.filter(r => r.id !== reward.id) } : prev)
        setConfirmDialog(c => ({ ...c, open: false }))
        setToast('Premio eliminado.')
      },
    })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-bunny"><Bunny mood={bunnyMood} size={38} /></span>
          <div><strong>Eli Bunny Power</strong><small>Mis puntos de autonomía</small></div>
        </div>
        <div className="top-actions">
          <button onClick={() => window.print()}>🖨️ Imprimir</button>
          {supabaseConfigured && <button onClick={logout}>Salir</button>}
        </div>
      </header>

      <nav className="nav">
        <button className={tab === 'panel' ? 'active' : ''} onClick={() => setTab('panel')}>🏠 Panel</button>
        <button className={tab === 'hoy' ? 'active' : ''} onClick={() => setTab('hoy')}>⭐ Hoy</button>
        <button className={tab === 'semana' ? 'active' : ''} onClick={() => setTab('semana')}>📅 Semana</button>
        <button className={tab === 'historial' ? 'active' : ''} onClick={() => setTab('historial')}>📒 Historial</button>
        <button className={tab === 'premios' ? 'active' : ''} onClick={() => setTab('premios')}>🎁 Premios</button>
        <button className={tab === 'config' ? 'active' : ''} onClick={() => setTab('config')}>⚙️ Configuración</button>
      </nav>

      <main className="content">
        <section className="hero-card">
          <div>
            <span className="eyebrow">MISIÓN DE LA SEMANA</span>
            <h1>¡Hola, {data.settings.child_name}! 🐰💜</h1>
            <p>{motivationalMessage(level)}</p>
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
                <p>{levelStatusMessage(total, data.settings)}</p>
              </div>
              <div className="stat-card">
                <span>📅 Semana</span>
                <strong>{weekStart} → {weekEnd}</strong>
                <small>Los puntos se reinician el lunes.</small>
              </div>
              <div className="stat-card">
                <span>🎯 Próximo objetivo</span>
                <strong>{level === 3 ? 'SUPER BUNNY' : `${nextTarget} PA`}</strong>
                <small>Te faltan {Math.max(0, nextTarget - total)} PA.</small>
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-head"><strong>Progreso hacia el siguiente nivel</strong><span>{total} / {nextTarget || total} PA</span></div>
              <div className="progress"><div style={{ width: `${progress}%` }} /></div>
              <div className="level-scale"><span>🌱 0</span><span>🌸 {data.settings.level1_min}</span><span>⚡ {data.settings.level2_min}</span><span>✨ {data.settings.level3_min}</span></div>
            </div>

            <div className="grid-3">
              <div className="stat-card"><span>⭐ PA de hoy</span><strong className="positive">+{todayEarned}</strong><small>Ganados hoy</small></div>
              <div className="stat-card"><span>🚫 PA perdidos hoy</span><strong className="negative">−{todayLost}</strong><small>Perdidos hoy</small></div>
              <div className="stat-card"><span>🏆 PA acumulados históricos</span><strong>{historicalTotal}</strong><small>Desde el inicio</small></div>
            </div>

            <div className="dashboard-grid">
              <div className="panel">
                <div className="panel-title"><h2>📒 Últimos movimientos</h2><span>Recientes</span></div>
                <div className="events">
                  {recentEvents.length === 0 && <p className="empty">Todavía no hay registros.</p>}
                  {recentEvents.map(e => <div className="event" key={e.id}><span>{e.special ? '🩹' : e.points >= 0 ? '⭐' : '🚫'}</span><div><strong>{e.note}</strong><small>{e.event_date} · {e.event_time}</small></div><b className={e.points >= 0 ? 'positive' : 'negative'}>{e.special ? 'Especial' : `${moneyPoints(e.points)} PA`}</b></div>)}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title"><h2>🎁 Premio desbloqueado</h2><span>Nivel {level || 0}</span></div>
                <div className="reward-grid">
                  {levelRewards.slice(0, 4).map(r => <div className={`reward ${r.level === 3 ? 'special' : ''}`} key={r.id}><div className="reward-icon">{r.level === 3 ? '✨' : r.level === 2 ? '⚡' : '🌸'}</div><strong>{r.name}</strong><p>{r.description}</p><b>{r.duration}</b><small>{r.frequency}</small></div>)}
                  {levelRewards.length === 0 && <p className="empty">Aún no hay premios desbloqueados.</p>}
                </div>
              </div>
            </div>

            <div className="panel info-panel">
              <div className="panel-title"><h2>📜 Reglas generales</h2></div>
              <div className="rules-cards">
                {GENERAL_RULES.map((r, i) => <div className="rule-card" key={i}><span>{i + 1}</span><p>{r}</p></div>)}
              </div>
            </div>
          </>
        )}

        {tab === 'hoy' && (
          <>
            <div className="grid-3">
              <div className="stat-card"><span>⭐ Ganados hoy</span><strong className="positive">+{todayEarned}</strong></div>
              <div className="stat-card"><span>🚫 Perdidos hoy</span><strong className="negative">−{todayLost}</strong></div>
              <div className="stat-card"><span>⚖️ Balance del día</span><strong>{moneyPoints(todayEarned - todayLost)}</strong></div>
            </div>
            <div className="panel">
              <div className="panel-title"><h2>⭐ Registrar una actividad</h2><button className="primary small" onClick={() => setSpecialOpen(true)}>🩹 Situación especial</button></div>
              <p className="hint">El registro debe hacerse cuando la actividad esté terminada. Los adultos pueden corregir un registro si hubo un error.</p>
              <div className="rule-grid large">
                {activeEarnings.map(r => <button key={r.id} className="rule-button earn" onClick={() => attemptRecord(r)}><span>＋{r.points}</span><strong>{r.name}</strong><small>{r.description}</small><small className="freq">{r.frequency_label}</small></button>)}
              </div>
            </div>
            <div className="panel danger-panel">
              <div className="panel-title"><h2>🚫 Registrar una penalización</h2><span>Solo por una situación real</span></div>
              <div className="rule-grid large">
                {activePenalties.map(r => <button key={r.id} className="rule-button penalty" onClick={() => attemptRecord(r)}><span>−{r.points}</span><strong>{r.name}</strong><small>{r.description}</small></button>)}
              </div>
            </div>
            <div className="panel">
              <div className="panel-title"><h2>📒 Actividades de hoy</h2><span>{moneyPoints(todayEarned - todayLost)} PA</span></div>
              <div className="events">
                {todayEvents.length === 0 && <p className="empty">Todavía no hay registros hoy.</p>}
                {todayEvents.map(e => <div className="event" key={e.id}><span>{e.special ? '🩹' : e.points >= 0 ? '⭐' : '🚫'}</span><div><strong>{e.note}</strong><small>{e.event_date} · {e.event_time}</small></div><b className={e.points >= 0 ? 'positive' : 'negative'}>{e.special ? 'Especial' : `${moneyPoints(e.points)} PA`}</b><button onClick={() => removeEvent(e.id)}>×</button></div>)}
              </div>
            </div>
          </>
        )}

        {tab === 'semana' && (
          <>
            <div className="panel">
              <div className="panel-title"><h2>📊 Progreso semanal</h2><span>{weekStart} → {weekEnd}</span></div>
              <div className="week-chart">
                {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d, i) => {
                  const dayTotal = weekEvents.filter(e => e.event_date === addDays(weekStart, i)).reduce((a, e) => a + e.points, 0)
                  const max = Math.max(1, ...['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((_, j) => weekEvents.filter(e => e.event_date === addDays(weekStart, j)).reduce((a, e) => a + e.points, 0)))
                  const height = Math.max(4, (Math.max(0, dayTotal) / max) * 100)
                  return (
                    <div className="week-chart-col" key={d}>
                      <div className="week-chart-bar-wrap"><div className="week-chart-bar" style={{ height: `${height}%` }} /></div>
                      <b>{dayTotal}</b>
                      <span>{d}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="panel">
              <div className="panel-title"><h2>⭐ Total de la semana</h2><span>{total} PA</span></div>
              <div className="progress"><div style={{ width: `${progress}%` }} /></div>
              <p className="hint">{levelStatusMessage(total, data.settings)} · Nivel actual: {levelEmoji(level)} {levelName(level)}</p>
            </div>
            <div className="panel">
              <div className="panel-title"><h2>📒 Historial de la semana</h2><span>{total} PA</span></div>
              <div className="events">
                {weekEvents.length === 0 && <p className="empty">Todavía no hay registros esta semana.</p>}
                {weekEvents.map(e => <div className="event" key={e.id}><span>{e.special ? '🩹' : e.points >= 0 ? '⭐' : '🚫'}</span><div><strong>{e.note}</strong><small>{e.event_date} · {e.event_time}</small></div><b className={e.points >= 0 ? 'positive' : 'negative'}>{e.special ? 'Especial' : `${moneyPoints(e.points)} PA`}</b><button onClick={() => removeEvent(e.id)}>×</button></div>)}
              </div>
            </div>
          </>
        )}

        {tab === 'historial' && (
          <>
            <div className="grid-3">
              <div className="stat-card"><span>🏆 Total acumulado histórico</span><strong>{historicalTotal}</strong></div>
              <div className="stat-card"><span>⭐ Ganados en total</span><strong className="positive">+{data.events.filter(e => e.points > 0).reduce((a, e) => a + e.points, 0)}</strong></div>
              <div className="stat-card"><span>🚫 Perdidos en total</span><strong className="negative">−{Math.abs(data.events.filter(e => e.points < 0).reduce((a, e) => a + e.points, 0))}</strong></div>
            </div>
            {weeklyGroups.map(g => (
              <div className="panel" key={g.start}>
                <div className="panel-title"><h2>📅 {g.start} → {g.end}</h2><span>{levelEmoji(g.level)} {levelName(g.level)} · {g.total} PA</span></div>
                <div className="events">
                  {g.events.map(e => <div className="event" key={e.id}><span>{e.special ? '🩹' : e.points >= 0 ? '⭐' : '🚫'}</span><div><strong>{e.note}</strong><small>{e.event_date} · {e.event_time}</small></div><b className={e.points >= 0 ? 'positive' : 'negative'}>{e.special ? 'Especial' : `${moneyPoints(e.points)} PA`}</b></div>)}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'premios' && (
          <>
            <div className="levels-overview">
              {[1, 2, 3].map(n => {
                const min = n === 1 ? data.settings.level1_min : n === 2 ? data.settings.level2_min : data.settings.level3_min
                const max = n === 1 ? data.settings.level1_max : n === 2 ? data.settings.level2_max : null
                return <div className={`level-box ${level >= n ? 'unlocked' : ''}`} key={n}><div>{n === 1 ? '🌸' : n === 2 ? '⚡' : '✨'}</div><strong>{levelName(n)}</strong><span>{min}{max ? `–${max}` : '+'} PA</span>{level >= n && <b>DESBLOQUEADO</b>}</div>
              })}
            </div>
            {[1, 2, 3].map(n => (
              <div className="panel" key={n}>
                <div className="panel-title"><h2>{levelEmoji(n)} Nivel {levelName(n)}</h2><span>{n === 1 ? `${data.settings.level1_min}–${data.settings.level1_max}` : n === 2 ? `${data.settings.level2_min}–${data.settings.level2_max}` : `${data.settings.level3_min}+`} PA</span></div>
                {n > 1 && <p className="hint">Incluye todos los premios de los niveles anteriores.</p>}
                <div className="reward-grid">{rewards.filter(r => r.level === n).map(r => <div className={`reward ${n === 3 ? 'special' : ''}`} key={r.id}><div className="reward-icon">{n === 3 ? '✨' : n === 2 ? '⚡' : '🌸'}</div><strong>{r.name}</strong><p>{r.description}</p><b>{r.duration}</b><small>{r.frequency}</small></div>)}</div>
              </div>
            ))}
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
              <div className="panel-title"><h2>⭐ Deberes y penalizaciones</h2><button className="primary small" onClick={openNewRule}>＋ Nueva regla</button></div>
              <div className="admin-list">{data.rules.map(r => <div className={`admin-row ${r.type}`} key={r.id}><span>{r.type === 'earning' ? '⭐' : '🚫'}</span><div><strong>{r.name}</strong><small>{r.description} · {r.frequency_label}{!r.active && ' · Inactiva'}</small></div><b>{r.type === 'earning' ? '+' : '−'}{r.points}</b><button onClick={() => openEditRule(r)}>Editar</button><button className="danger-text" onClick={() => askRemoveRule(r)}>Eliminar</button></div>)}</div>
            </div>

            <div className="panel">
              <div className="panel-title"><h2>🎁 Premios</h2><button className="primary small" onClick={openNewReward}>＋ Nuevo premio</button></div>
              <div className="admin-list">{data.rewards.map(r => <div className="admin-row" key={r.id}><span>{r.level === 3 ? '✨' : r.level === 2 ? '⚡' : '🌸'}</span><div><strong>N{r.level} · {r.name}</strong><small>{r.duration} · {r.frequency}{!r.active && ' · Inactivo'}</small></div><button onClick={() => openEditReward(r)}>Editar</button><button className="danger-text" onClick={() => askRemoveReward(r)}>Eliminar</button></div>)}</div>
            </div>

            <div className="panel info-panel">
              <h2>📜 Reglas generales</h2>
              <div className="rules-cards">
                {GENERAL_RULES.map((r, i) => <div className="rule-card" key={i}><span>{i + 1}</span><p>{r}</p></div>)}
              </div>
            </div>

            <div className="panel info-panel">
              <h2>🧠 Reglas de convivencia</h2>
              <ul>
                <li>El sistema premia la autonomía, no la perfección.</li>
                <li>Si hay enfermedad, evento familiar o una circunstancia extraordinaria, márcala como situación especial: no suma ni resta puntos.</li>
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
        <div className="print-days">{['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d, i) => <div key={d}><b>{d}</b><span>{weekEvents.filter(e => e.event_date === addDays(weekStart, i)).reduce((a, e) => a + e.points, 0)} PA</span><i>____________</i></div>)}</div>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <RuleFormModal open={ruleFormOpen} rule={editingRule} onCancel={() => setRuleFormOpen(false)} onSave={submitRule} />
      <RewardFormModal open={rewardFormOpen} reward={editingReward} onCancel={() => setRewardFormOpen(false)} onSave={submitReward} />
      <SpecialSituationModal open={specialOpen} onCancel={() => setSpecialOpen(false)} onSave={recordSpecial} />
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        danger={confirmDialog.danger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(c => ({ ...c, open: false }))}
      />
      {authModals}
    </div>
  )
}

export default App