import type { RoomType } from '../room.types'

export class AddRoomDto {
  room_number!: string
  type!: RoomType
  price_per_night!: number
  currency!: 'INR'
}
