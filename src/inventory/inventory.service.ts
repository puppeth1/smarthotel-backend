import { Injectable } from '@nestjs/common'

@Injectable()
export class InventoryService {
  private itemsByHotel: Record<string, any[]> = {}

  addItem(name: string, unit: string, stock: number, minStock = 1, hotelId?: string) {
    const hid = hotelId || 'hotel_default'
    if (!this.itemsByHotel[hid]) this.itemsByHotel[hid] = []
    const item = {
      id: `item_${(this.itemsByHotel[hid]?.length || 0) + 1}`,
      name,
      unit,
      stock,
      min_stock: minStock,
      created_at: new Date(),
    }
    this.itemsByHotel[hid].push(item)
    return item
  }

  updateStock(name: string, stock: number, hotelId?: string) {
    const list = hotelId ? this.itemsByHotel[hotelId] || [] : Object.values(this.itemsByHotel).flat()
    const item = list.find((i) => i.name.toLowerCase() === name.toLowerCase())
    if (!item) return null
    item.stock = stock
    ;(item as any).updated_at = new Date()
    return item
  }

  updateItem(name: string, stock: number, hotelId?: string) {
    return this.updateStock(name, stock, hotelId)
  }

  deductStock(name: string, qty: number, hotelId?: string) {
    const list = hotelId ? this.itemsByHotel[hotelId] || [] : Object.values(this.itemsByHotel).flat()
    const item = list.find((i) => i.name.toLowerCase() === name.toLowerCase())
    if (!item || item.stock < qty) return null
    item.stock -= qty
    return item
  }

  listItems(hotelId?: string) {
    if (hotelId) return this.itemsByHotel[hotelId] || []
    return Object.values(this.itemsByHotel).flat()
  }

  getLowStockItems(hotelId?: string) {
    const list = hotelId ? this.itemsByHotel[hotelId] || [] : Object.values(this.itemsByHotel).flat()
    return list.filter((item: any) => item.stock <= (item.min_stock ?? 0))
  }
}
