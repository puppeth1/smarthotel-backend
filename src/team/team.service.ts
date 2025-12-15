import { Injectable } from '@nestjs/common'
import { Role } from '../common/roles'

@Injectable()
export class TeamService {
  private staffByHotel: Record<string, any[]> = {}

  addStaff(name: string, role: Role, hotelId?: string) {
    const hid = hotelId || 'hotel_default'
    if (!this.staffByHotel[hid]) this.staffByHotel[hid] = []
    const id = `staff_${(this.staffByHotel[hid]?.length || 0) + 1}`
    const index = (this.staffByHotel[hid] || []).filter((s) => s.role === role).length + 2
    const actor_id = `u_${role.toLowerCase()}_${index}`
    const record = { id, name, role, actor_id, created_at: new Date(), active: true }
    this.staffByHotel[hid].push(record)
    return record
  }

  changeRole(name: string, role: Role, hotelId?: string) {
    const list = hotelId ? this.staffByHotel[hotelId] || [] : Object.values(this.staffByHotel).flat()
    const person = list.find((s) => s.name.toLowerCase() === name.toLowerCase())
    if (!person) return null
    const index = list.filter((s) => s.role === role).length + 2
    person.role = role
    person.actor_id = `u_${role.toLowerCase()}_${index}`
    return person
  }

  removeStaff(name: string, hotelId?: string) {
    const list = hotelId ? this.staffByHotel[hotelId] || [] : Object.values(this.staffByHotel).flat()
    const person = list.find((s) => s.name.toLowerCase() === name.toLowerCase())
    if (!person) return null
    person.active = false
    return person
  }

  listTeam(hotelId?: string) {
    if (hotelId) return this.staffByHotel[hotelId] || []
    return Object.values(this.staffByHotel).flat()
  }
}
