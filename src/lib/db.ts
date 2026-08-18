import { supabase, supabaseConfigured } from './supabase'
import type { PointEvent, Reward, Rule, Settings } from '../types'
import { defaultRewards, defaultRules, defaultSettings } from './defaults'

const LS = 'eli-bunny-power-local'

interface LocalData {
  settings: Settings
  rules: Rule[]
  rewards: Reward[]
  events: PointEvent[]
}

function normalizeRule(r: Partial<Rule>): Rule {
  return {
    id: r.id ?? crypto.randomUUID(),
    user_id: r.user_id ?? 'local-user',
    name: r.name ?? '',
    description: r.description ?? '',
    points: r.points ?? 0,
    type: r.type ?? 'earning',
    active: r.active ?? true,
    frequency_label: r.frequency_label ?? 'Cualquier día',
    max_per_day: r.max_per_day ?? null,
    max_per_week: r.max_per_week ?? null,
    school_days_only: r.school_days_only ?? false,
    created_at: r.created_at,
  }
}

function normalizeEvent(e: Partial<PointEvent>): PointEvent {
  return {
    id: e.id ?? crypto.randomUUID(),
    user_id: e.user_id ?? 'local-user',
    rule_id: e.rule_id ?? null,
    event_date: e.event_date ?? new Date().toISOString().slice(0, 10),
    event_time: e.event_time ?? '00:00',
    points: e.points ?? 0,
    note: e.note ?? '',
    type: e.type ?? ((e.points ?? 0) < 0 ? 'penalty' : 'earning'),
    created_by: e.created_by ?? 'adult',
    special: e.special ?? false,
    special_reason: e.special_reason ?? null,
    created_at: e.created_at,
  }
}

function localData(): LocalData {
  const raw = localStorage.getItem(LS)
  if (raw) {
    const parsed = JSON.parse(raw) as LocalData
    const migrated: LocalData = {
      settings: parsed.settings,
      rules: parsed.rules.map(normalizeRule),
      rewards: parsed.rewards,
      events: parsed.events.map(normalizeEvent),
    }
    saveLocal(migrated)
    return migrated
  }
  const user = 'local-user'
  const now = new Date().toISOString()
  const data: LocalData = {
    settings: { id: crypto.randomUUID(), user_id: user, ...defaultSettings, updated_at: now },
    rules: defaultRules.map(r => ({ ...r, id: crypto.randomUUID(), user_id: user, created_at: now })),
    rewards: defaultRewards.map(r => ({ ...r, id: crypto.randomUUID(), user_id: user, created_at: now })),
    events: []
  }
  localStorage.setItem(LS, JSON.stringify(data))
  return data
}

function saveLocal(data: LocalData) {
  localStorage.setItem(LS, JSON.stringify(data))
}

export async function seedUser(userId: string) {
  if (!supabaseConfigured || !supabase) return
  const { data: settings } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle()
  if (!settings) await supabase.from('settings').insert({ user_id: userId, ...defaultSettings })
  const { count: ruleCount } = await supabase.from('rules').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  if (!ruleCount) await supabase.from('rules').insert(defaultRules.map(r => ({ ...r, user_id: userId })))
  const { count: rewardCount } = await supabase.from('rewards').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  if (!rewardCount) await supabase.from('rewards').insert(defaultRewards.map(r => ({ ...r, user_id: userId })))
}

export async function loadAll(userId?: string) {
  if (!supabaseConfigured || !supabase || !userId) return localData()
  await seedUser(userId)
  const [s, r, rw, e] = await Promise.all([
    supabase.from('settings').select('*').eq('user_id', userId).single(),
    supabase.from('rules').select('*').eq('user_id', userId).order('type').order('created_at'),
    supabase.from('rewards').select('*').eq('user_id', userId).order('level').order('created_at'),
    supabase.from('point_events').select('*').eq('user_id', userId).order('event_date', { ascending: false }).order('event_time', { ascending: false })
  ])
  if (s.error) throw s.error
  if (r.error) throw r.error
  if (rw.error) throw rw.error
  if (e.error) throw e.error
  return {
    settings: s.data as Settings,
    rules: (r.data as Rule[]).map(normalizeRule),
    rewards: rw.data as Reward[],
    events: (e.data as PointEvent[]).map(normalizeEvent),
  }
}

export async function updateSettings(userId: string, patch: Partial<Settings>) {
  if (!supabaseConfigured || !supabase) {
    const d = localData(); d.settings = { ...d.settings, ...patch }; saveLocal(d); return d.settings
  }
  const { data, error } = await supabase.from('settings').update(patch).eq('user_id', userId).select().single()
  if (error) throw error
  return data as Settings
}

export type RuleInput = Partial<Rule> & { name: string; type: 'earning' | 'penalty'; points: number }

function ruleFields(rule: RuleInput) {
  return {
    name: rule.name,
    description: rule.description ?? '',
    points: rule.points,
    type: rule.type,
    active: rule.active ?? true,
    frequency_label: rule.frequency_label ?? 'Cualquier día',
    max_per_day: rule.max_per_day ?? null,
    max_per_week: rule.max_per_week ?? null,
    school_days_only: rule.school_days_only ?? false,
  }
}

export async function saveRule(userId: string, rule: RuleInput) {
  if (!supabaseConfigured || !supabase) {
    const d = localData()
    const item: Rule = normalizeRule({ ...ruleFields(rule), id: rule.id, user_id: userId })
    const i = d.rules.findIndex(x => x.id === item.id)
    if (i >= 0) d.rules[i] = item; else d.rules.push(item)
    saveLocal(d); return item
  }
  const { data, error } = rule.id
    ? await supabase.from('rules').update(ruleFields(rule)).eq('id', rule.id).select().single()
    : await supabase.from('rules').insert({ user_id: userId, ...ruleFields(rule) }).select().single()
  if (error) throw error
  return normalizeRule(data as Rule)
}

export async function deleteRule(userId: string, id: string) {
  if (!supabaseConfigured || !supabase) {
    const d = localData(); d.rules = d.rules.filter(x => x.id !== id); saveLocal(d); return
  }
  const { error } = await supabase.from('rules').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function saveReward(userId: string, reward: Partial<Reward> & { level: number; name: string }) {
  if (!supabaseConfigured || !supabase) {
    const d = localData()
    const item: Reward = { id: reward.id ?? crypto.randomUUID(), user_id: userId, level: reward.level, name: reward.name, description: reward.description ?? '', duration: reward.duration ?? '', frequency: reward.frequency ?? '', active: reward.active ?? true }
    const i = d.rewards.findIndex(x => x.id === item.id)
    if (i >= 0) d.rewards[i] = item; else d.rewards.push(item)
    saveLocal(d); return item
  }
  const { data, error } = reward.id
    ? await supabase.from('rewards').update({ level: reward.level, name: reward.name, description: reward.description ?? '', duration: reward.duration ?? '', frequency: reward.frequency ?? '', active: reward.active ?? true }).eq('id', reward.id).select().single()
    : await supabase.from('rewards').insert({ user_id: userId, level: reward.level, name: reward.name, description: reward.description ?? '', duration: reward.duration ?? '', frequency: reward.frequency ?? '' }).select().single()
  if (error) throw error
  return data as Reward
}

export async function deleteReward(userId: string, id: string) {
  if (!supabaseConfigured || !supabase) {
    const d = localData(); d.rewards = d.rewards.filter(x => x.id !== id); saveLocal(d); return
  }
  const { error } = await supabase.from('rewards').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function addEvent(userId: string, event: Omit<PointEvent, 'id' | 'user_id' | 'created_at'>) {
  if (!supabaseConfigured || !supabase) {
    const d = localData()
    const item: PointEvent = { ...event, id: crypto.randomUUID(), user_id: userId, created_at: new Date().toISOString() }
    d.events.unshift(item); saveLocal(d); return item
  }
  const { data, error } = await supabase.from('point_events').insert({ ...event, user_id: userId }).select().single()
  if (error) throw error
  return normalizeEvent(data as PointEvent)
}

export async function deleteEvent(userId: string, id: string) {
  if (!supabaseConfigured || !supabase) {
    const d = localData(); d.events = d.events.filter(x => x.id !== id); saveLocal(d); return
  }
  const { error } = await supabase.from('point_events').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}