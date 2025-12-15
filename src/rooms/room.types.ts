export const ROOM_TYPES = [
  'single',
  'double',
  'suite',
  'deluxe',
  'cabin',
  'family suite',
  'garden view',
  'river view',
  'mountain view',
] as const

export type RoomType = (typeof ROOM_TYPES)[number]

export function normalizeRoomType(input: string): RoomType | null {
  const value = input.trim().toLowerCase()
  return (ROOM_TYPES as readonly string[]).includes(value) ? (value as RoomType) : null
}
