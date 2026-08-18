export type RuleType = 'earning' | 'penalty'

export interface Rule {
  id: string
  user_id: string
  name: string
  description: string
  points: number
  type: RuleType
  active: boolean
  created_at?: string
}

export interface PointEvent {
  id: string
  user_id: string
  rule_id: string | null
  event_date: string
  points: number
  note: string
  created_at?: string
}

export interface Reward {
  id: string
  user_id: string
  level: number
  name: string
  description: string
  duration: string
  frequency: string
  active: boolean
  created_at?: string
}

export interface Settings {
  id: string
  user_id: string
  child_name: string
  week_start: number
  level1_min: number
  level1_max: number
  level2_min: number
  level2_max: number
  level3_min: number
  youtube_penalty: number
  updated_at?: string
}

export interface WeekStats {
  total: number
  start: string
  end: string
}