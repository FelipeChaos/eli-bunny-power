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

function localData(): LocalData {
  const raw = localStorage.getItem(LS)
  if (raw) return JSON.parse(raw)
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
    supabase.from('point_events').select('*').eq('user_id', userId).order('event_date', { ascending: false }).order('created_at', { ascending: false })
  ])
  if (s.error) throw s.error
  if (r.error) throw r.error
  if (rw.error) throw rw.error
  if (e.error) throw e.error
  return { settings: s.data as Settings, rules: r.data as Rule[], rewards: rw.data as Reward[], events: e.data as PointEvent[] }
}

export async function updateSettings(userId: string, patch: Partial<Settings>) {
  if (!supabaseConfigured || !supabase) {
    const d = localData(); d.settings = { ...d.settings, ...patch }; saveLocal(d); return d.settings
  }
  const { data, error } = await supabase.from('settings').update(patch).eq('user_id', userId).select().single()
  if (error) throw error
  return data as Settings
}

export async function saveRule(userId: string, rule: Partial<Rule> & { name: string; type: 'earning' | 'penalty'; points: number }) {
  if (!supabaseConfigured || !supabase) {
    const d = localData()
    const item: Rule = { id: rule.id ?? crypto.randomUUID(), user_id: userId, name: rule.name, description: rule.description ?? '', points: rule.points, type: rule.type, active: rule.active ?? true }
    const i = d.rules.findIndex(x => x.id === item.id)
    if (i >= 0) d.rules[i] = item; else d.rules.push(item)
    saveLocal(d); return item
  }
  const { data, error } = rule.id
    ? await supabase.from('rules').update({ name: rule.name, description: rule.description ?? '', points: rule.points, type: rule.type, active: rule.active ?? true }).eq('id', rule.id).select().single()
    : await supabase.from('rules').insert({ user_id: userId, name: rule.name, description: rule.description ?? '', points: rule.points, type: rule.type, active: rule.active ?? true }).select().single()
  if (error) throw error
  return data as Rule
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
  return data as PointEvent
}

export async function deleteEvent(userId: string, id: string) {
  if (!supabaseConfigured || !supabase) {
    const d = localData(); d.events = d.events.filter(x => x.id !== id); saveLocal(d); return
  }
  const { error } = await supabase.from('point_events').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}