export type Plan = 'BASIC' | 'PRO' | 'ENTERPRISE'

export const PLAN_LIMITS: Record<Plan, { hotels: number; staff: number | 'Infinity' }> = {
  BASIC: { hotels: 1, staff: 5 },
  PRO: { hotels: 3, staff: 'Infinity' },
  ENTERPRISE: { hotels: Number.POSITIVE_INFINITY as any, staff: 'Infinity' },
}

export const ACTOR_PLAN: Record<string, Plan> = {
  u_owner: 'BASIC',
}

export function getLimitValue(v: number | 'Infinity') {
  return v === 'Infinity' ? Number.POSITIVE_INFINITY : v
}
