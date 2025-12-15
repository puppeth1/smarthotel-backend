import { Injectable } from '@nestjs/common'

@Injectable()
export class BillingService {
  private invoicesByHotel: Record<string, any[]> = {}

  generateRoomBill(room: any, hotelId?: string) {
    const hid = hotelId || 'hotel_default'
    if (!this.invoicesByHotel[hid]) this.invoicesByHotel[hid] = []
    const invoice = {
      invoice_id: `inv_${(this.invoicesByHotel[hid]?.length || 0) + 1}`,
      room_number: room.room_number,
      amount: room.price_per_night,
      currency: 'INR',
      status: 'UNPAID',
      created_at: new Date(),
    }
    this.invoicesByHotel[hid].push(invoice)
    return invoice
  }

  listInvoices(hotelId?: string) {
    if (hotelId) return this.invoicesByHotel[hotelId] || []
    return Object.values(this.invoicesByHotel).flat()
  }

  collectPayment(invoice_id: string, method: 'UPI' | 'CASH' | 'CARD', hotelId?: string) {
    const list = hotelId ? this.invoicesByHotel[hotelId] || [] : Object.values(this.invoicesByHotel).flat()
    const invoice = list.find((i) => i.invoice_id === invoice_id)
    if (!invoice) return null
    if (invoice.status === 'PAID') {
      return invoice
    }
    invoice.status = 'PAID'
    invoice.payment_method = method
    invoice.paid_at = new Date()
    return invoice
  }
}
