import { Injectable } from '@nestjs/common'

@Injectable()
export class OrdersService {
  private ordersByHotel: Record<string, any[]> = {}

  createOrder(room_number: string, items: any[], hotelId?: string) {
    const hid = hotelId || 'hotel_default'
    if (!this.ordersByHotel[hid]) this.ordersByHotel[hid] = []
    const order = {
      id: `order_${(this.ordersByHotel[hid]?.length || 0) + 1}`,
      room_number,
      items,
      status: 'CREATED',
      created_at: new Date(),
    }
    this.ordersByHotel[hid].push(order)
    return order
  }

  listOrders(hotelId?: string) {
    if (hotelId) return this.ordersByHotel[hotelId] || []
    return Object.values(this.ordersByHotel).flat()
  }

  updateStatus(orderId: string, status: string, hotelId?: string) {
    const list = hotelId ? this.ordersByHotel[hotelId] || [] : Object.values(this.ordersByHotel).flat()
    const order = list.find((o) => o.id === orderId)
    if (!order) return null
    order.status = status
    order.updated_at = new Date()
    return order
  }
}
