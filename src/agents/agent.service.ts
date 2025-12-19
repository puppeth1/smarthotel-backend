import { Injectable } from '@nestjs/common'
import { ACTOR_ROLES } from '../common/actor-role.map'
import { ROLE_PERMISSIONS } from '../common/roles'
import { ACTOR_PLAN, PLAN_LIMITS, getLimitValue } from '../common/plans'

import { RoomsService } from '../rooms/rooms.service'
import { BillingService } from '../billing/billing.service'
import { InventoryService } from '../inventory/inventory.service'
import { MenuService } from '../menu/menu.service'
import { OrdersService } from '../orders/orders.service'
import { HotelsService } from '../hotels/hotels.service'
import { TeamService } from '../team/team.service'
import { DashboardService } from '../dashboard/dashboard.service'
import { normalizeRoomType } from '../rooms/room.types'

@Injectable()
export class AgentService {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly billingService: BillingService,
    private readonly inventoryService: InventoryService,
    private readonly menuService: MenuService,
    private readonly ordersService: OrdersService,
    private readonly hotelsService: HotelsService,
    private readonly teamService: TeamService,
    private readonly dashboardService: DashboardService,
  ) {}

  private pendingConfirmation: { action: string; payload: any } | null = null
  private pendingFoodOrder: any = null
  private activeHotelByActor: Record<string, string> = {}

  // ================= CORE ENTRY =================
  handleMessage(input: { text: string; tenant_id?: string; actor_id: string }) {
    const raw = (input.text || '').trim()
    const text = raw.toLowerCase()
    const actorId = input.actor_id
    const hotelId =
      this.activeHotelByActor[actorId] ||
      input.tenant_id ||
      'hotel_default'

    // ---- confirmation ----
    if (this.pendingConfirmation) {
      if (text === 'yes') return this.executePendingAction()
      if (text === 'no') {
        this.pendingConfirmation = null
        return { status: 'cancelled', message: 'Action cancelled.' }
      }
    }

    // ================= HOTEL =================
    if (text.startsWith('add hotel')) {
      this.requireOwner(actorId)

      const match = raw.match(/add\s+hotel\s+(.+)/i)
      if (!match) return this.usage('Add hotel <Hotel Name>')

      const plan = ACTOR_PLAN[actorId] || 'BASIC'
      const current = this.hotelsService.listHotelsByOwner(actorId).length
      const limit = PLAN_LIMITS[plan].hotels

      if (current >= limit) {
        return {
          status: 'upgrade_required',
          message: `Your plan allows only ${limit} hotel(s). Upgrade to PRO.`,
        }
      }

      const hotel = this.hotelsService.addHotel(actorId, match[1].trim())
      this.activeHotelByActor[actorId] = hotel.id
      return { status: 'success', action: 'ADD_HOTEL', data: hotel }
    }

    if (text.startsWith('switch to hotel')) {
      this.requireOwner(actorId)

      const match = raw.match(/switch\s+to\s+hotel\s+(hotel_\d+)/i)
      if (!match) return this.usage('Switch to hotel <hotel_id>')

      const hotel = this.hotelsService.getById(match[1])
      if (!hotel) return this.error('Hotel not found')

      this.activeHotelByActor[actorId] = hotel.id
      return { status: 'success', action: 'SWITCH_HOTEL', data: hotel }
    }

    // ================= DASHBOARD STATS =================
    if (text === 'stats' || text === 'dashboard' || text === 'show stats') {
      return this.ok(this.dashboardService.getStats(hotelId))
    }
    
    if (text.includes('how many') && text.includes('vacant')) {
       const s = this.dashboardService.getStats(hotelId)
       return this.ok({ vacantRooms: s.vacantRooms, message: `There are ${s.vacantRooms} vacant rooms.` })
    }

    if (text.includes('revenue')) {
        const s = this.dashboardService.getStats(hotelId)
        return this.ok({ todayRevenue: s.todayRevenue, monthlyRevenue: s.monthlyRevenue })
     }

    // ================= ROOMS =================
    if (
      text === 'list rooms' ||
      text === 'list room' ||
      text === 'show rooms' ||
      text === 'show room'
    ) {
      return this.ok(this.roomsService.listRooms(hotelId))
    }

    if (text.startsWith('add room')) {
      this.require(actorId, 'ROOMS')
      return this.handleAddRoom(raw, hotelId)
    }

    if (text.startsWith('mark room')) {
      this.require(actorId, 'ROOMS')
      return this.handleMarkRoom(raw, hotelId)
    }

    if (text.startsWith('checkout room')) {
      this.require(actorId, 'BILLING')
      return this.handleCheckout(raw, hotelId)
    }

    // ================= INVENTORY =================
    if (text === 'list inventory')
      return this.ok(this.inventoryService.listItems(hotelId))

    if (text.startsWith('add inventory')) {
      this.require(actorId, 'INVENTORY')
      return this.handleAddInventory(raw, hotelId)
    }

    if (text.startsWith('update inventory')) {
      this.require(actorId, 'INVENTORY')
      return this.handleUpdateInventory(raw, hotelId)
    }

    // ================= MENU =================
    if (text === 'list menu')
      return this.ok(this.menuService.listItems(hotelId))

    if (text.startsWith('add_menu_json')) {
      this.require(actorId, 'MENU')
      try {
        const jsonStr = raw.replace(/^add_menu_json\s*/i, '')
        const data = JSON.parse(jsonStr)
        return this.ok(
          this.menuService.addItem(
            data.name,
            Number(data.price),
            data.recipe || [],
            hotelId,
            {
              category: data.category,
              available: data.available,
              preparationTime: data.preparationTime,
              autoDisable: data.autoDisable
            }
          )
        )
      } catch (e) {
        return this.error('Invalid JSON format')
      }
    }

    if (text.startsWith('add menu')) {
      this.require(actorId, 'MENU')
      return this.handleAddMenu(raw, hotelId)
    }

    // ================= FOOD ORDERS =================
    if (text.startsWith('create food order')) {
      this.require(actorId, 'ORDERS')
      return this.handleCreateFoodOrder(raw, hotelId)
    }

    if (text.startsWith('add ') && this.pendingFoodOrder) {
      this.require(actorId, 'ORDERS')
      return this.handleAddFoodItem(raw)
    }

    if (text === 'confirm order') {
      this.require(actorId, 'ORDERS')
      return this.handleConfirmFoodOrder()
    }

    // ================= TEAM =================
    if (text === 'list team') {
      this.require(actorId, 'TEAM_MANAGEMENT')
      return this.ok(this.teamService.listTeam(hotelId))
    }

    if (text.startsWith('add staff')) {
      this.require(actorId, 'TEAM_MANAGEMENT')
      return this.handleAddStaff(raw, hotelId, actorId)
    }

    return this.error('Command not understood')
  }

  // ================= HELPERS =================
  private getRole(actorId: string) {
    return ACTOR_ROLES[actorId] || 'KITCHEN'
  }

  private require(actorId: string, permission: string) {
    const role = this.getRole(actorId)
    if (role === 'OWNER') return
    if (!ROLE_PERMISSIONS[role]?.includes(permission))
      throw new Error('Permission denied')
  }

  private requireOwner(actorId: string) {
    if (this.getRole(actorId) !== 'OWNER')
      throw new Error('Owner access only')
  }

  private ok(data: any) {
    return { status: 'success', data }
  }

  private error(message: string) {
    return { status: 'error', message }
  }

  private usage(cmd: string) {
    return { status: 'error', message: `Usage: ${cmd}` }
  }

  // ================= HANDLERS =================
  private handleAddRoom(raw: string, hotelId: string) {
    const m = raw.match(/room\s+(\d+).*as\s+(.+?)\s+price\s+(\d+)/i)
    if (!m) return this.usage('Add room 101 as deluxe price 5000')
    const validatedType = normalizeRoomType(m[2])
    if (!validatedType) return this.usage('Invalid room type. Allowed: single, double, suite, deluxe, cabin, family suite, garden view, river view, mountain view')

    return this.ok(
      this.roomsService.addRoom(
        {
          room_number: m[1],
          type: validatedType,
          price_per_night: Number(m[3]),
          currency: 'INR',
        },
        hotelId,
      ),
    )
  }

  private handleMarkRoom(raw: string, hotelId: string) {
    const m = raw.match(/room\s+(\d+)\s+as\s+(\w+)/i)
    if (!m) return this.usage('Mark room 101 as cleaning')

    this.pendingConfirmation = {
      action: 'UPDATE_ROOM',
      payload: { room: m[1], status: m[2], hotelId },
    }
    return { status: 'confirmation_required', message: 'Confirm? YES / NO' }
  }

  private handleCheckout(raw: string, hotelId: string) {
    const m = raw.match(/room\s+(\d+)/)
    if (!m) return this.usage('Checkout room 101')

    this.pendingConfirmation = {
      action: 'CHECKOUT',
      payload: { room: m[1], hotelId },
    }
    return { status: 'confirmation_required', message: 'Confirm checkout?' }
  }

  private handleAddInventory(raw: string, hotelId: string) {
    // Basic match: add inventory <Name> <Qty> <Unit> <Optional Extras>
    // Extras: min <n>, category <str>, cost <n>, supplier <str>, phone <str>
    const m = raw.match(/add\s+inventory\s+(.+?)\s+(\d+)\s+(\w+)(.*)/i)
    if (!m) return this.usage('Add inventory Paneer 5 kg')

    const name = m[1].trim()
    const qty = Number(m[2])
    const unit = m[3].trim()
    const extras = m[4] || ''

    // Parse extras
    const minMatch = extras.match(/min\s+(\d+)/i)
    const catMatch = extras.match(/category\s+([a-z]+)/i)
    const costMatch = extras.match(/cost\s+(\d+)/i)
    const supMatch = extras.match(/supplier\s+(.+?)(\s+phone|$)/i)
    const phoneMatch = extras.match(/phone\s+([\d\-\+]+)/i)

    const minStock = minMatch ? Number(minMatch[1]) : 1
    const category = catMatch ? catMatch[1] : undefined
    const cost = costMatch ? Number(costMatch[1]) : undefined
    const supplier = supMatch ? supMatch[1].trim() : undefined
    const phone = phoneMatch ? phoneMatch[1] : undefined

    return this.ok(
      this.inventoryService.addItem(
        name,
        unit,
        qty,
        minStock,
        category,
        cost,
        supplier,
        phone,
        hotelId,
      ),
    )
  }

  private handleUpdateInventory(raw: string, hotelId: string) {
    const m = raw.match(/update\s+inventory\s+(.+?)\s+to\s+(\d+)/i)
    if (!m) return this.usage('Update inventory Paneer to 3')

    return this.ok(
      this.inventoryService.updateItem(m[1], Number(m[2]), hotelId),
    )
  }

  private handleAddMenu(raw: string, hotelId: string) {
    const m = raw.match(/add\s+menu\s+(.+?)\s+(\d+)\s+uses\s+(.+?)\s+(\d+)\s+(\w+)/i)
    if (!m) return this.usage('Add menu Paneer Butter Masala 280 uses Paneer 0.2 kg')

    return this.ok(
      this.menuService.addItem(
        m[1],
        Number(m[2]),
        [{ item: m[3], qty: Number(m[4]), unit: m[5] }],
        hotelId,
      ),
    )
  }

  private handleCreateFoodOrder(raw: string, hotelId: string) {
    const m = raw.match(/room\s+(\d+)/)
    if (!m) return this.usage('Create food order for room 101')

    this.pendingFoodOrder = { room: m[1], items: [], hotelId }
    return this.ok('Food order started')
  }

  private handleAddFoodItem(raw: string) {
    const m = raw.match(/add\s+(\d+)\s+(.+)/i)
    if (!m) return this.usage('Add 2 Paneer Butter Masala')

    const item = this.menuService
      .listItems(this.pendingFoodOrder.hotelId)
      .find((i) => i.name.toLowerCase() === m[2].toLowerCase())

    if (!item) return this.error('Menu item not found')

    this.pendingFoodOrder.items.push({
      name: item.name,
      qty: Number(m[1]),
      price: item.price,
      recipe: item.recipe,
    })

    return this.ok('Item added')
  }

  private handleConfirmFoodOrder() {
    this.pendingConfirmation = {
      action: 'CONFIRM_ORDER',
      payload: this.pendingFoodOrder,
    }
    return { status: 'confirmation_required', message: 'Confirm food order?' }
  }

  private handleAddStaff(raw: string, hotelId: string, actorId: string) {
    const m = raw.match(/add\s+staff\s+(.+?)\s+as\s+(manager|kitchen)/i)
    if (!m) return this.usage('Add staff Ravi as manager')

    const plan = ACTOR_PLAN[actorId] || 'BASIC'
    const limit = getLimitValue(PLAN_LIMITS[plan].staff)
    const current = this.teamService.listTeam(hotelId).length

    if (current >= limit)
      return { status: 'upgrade_required', message: 'Staff limit reached.' }

    return this.ok(
      this.teamService.addStaff(m[1], m[2].toUpperCase() as 'MANAGER' | 'KITCHEN', hotelId),
    )
  }

  private executePendingAction() {
    const a = this.pendingConfirmation
    this.pendingConfirmation = null
    if (!a) return this.error('No pending action')

    if (a.action === 'UPDATE_ROOM')
      return this.ok(
        this.roomsService.updateRoomStatus(
          a.payload.room,
          a.payload.status,
          a.payload.hotelId,
        ),
      )

    if (a.action === 'CHECKOUT')
      return this.ok(
        this.billingService.generateRoomBill(
          this.roomsService.checkoutRoom(
            a.payload.room,
            a.payload.hotelId,
          ),
          a.payload.hotelId,
        ),
      )

    if (a.action === 'CONFIRM_ORDER')
      return this.ok(
        this.ordersService.createOrder(
          a.payload.room,
          a.payload.items,
          a.payload.hotelId,
        ),
      )

    return this.error('Unknown action')
  }
}
