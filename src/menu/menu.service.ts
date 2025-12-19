import { Injectable } from '@nestjs/common'

@Injectable()
export class MenuService {
  private itemsByHotel: Record<string, any[]> = {}

  addItem(name: string, price: number, recipe: { item: string; qty: number; unit: string }[], hotelId?: string, options: { category?: string; available?: boolean; preparationTime?: number; autoDisable?: boolean } = {}) {
    const hid = hotelId || 'hotel_default'
    if (!this.itemsByHotel[hid]) this.itemsByHotel[hid] = []
    const menuItem = {
      id: `menu_${(this.itemsByHotel[hid]?.length || 0) + 1}`,
      name,
      price,
      recipe,
      available: options.available ?? true,
      category: options.category || 'Main Course',
      preparationTime: options.preparationTime || 0,
      autoDisable: options.autoDisable || false,
      created_at: new Date(),
    }
    this.itemsByHotel[hid].push(menuItem)
    return menuItem
  }

  updatePrice(name: string, price: number, hotelId?: string) {
    const list = hotelId ? this.itemsByHotel[hotelId] || [] : Object.values(this.itemsByHotel).flat()
    const item = list.find((i) => i.name.toLowerCase() === name.toLowerCase())
    if (!item) return null
    item.price = price
    return item
  }

  listItems(hotelId?: string) {
    if (hotelId) return this.itemsByHotel[hotelId] || []
    return Object.values(this.itemsByHotel).flat()
  }
}
