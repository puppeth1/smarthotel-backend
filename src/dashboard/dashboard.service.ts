import { Injectable } from '@nestjs/common'
import { RoomsService } from '../rooms/rooms.service'
import { BillingService } from '../billing/billing.service'
import { OrdersService } from '../orders/orders.service'
import { HotelsService } from '../hotels/hotels.service'
import { InvoiceStatus } from '../billing/billing.types'

@Injectable()
export class DashboardService {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly billingService: BillingService,
    private readonly ordersService: OrdersService,
    private readonly hotelsService: HotelsService,
  ) {}

  getStats(hotelId: string) {
    const settings = this.hotelsService.getSettings(hotelId) || {}
    const rooms = this.roomsService.listRooms(hotelId)
    const invoices = this.billingService.listInvoices(hotelId)
    const orders = this.ordersService.listOrders(hotelId)

    // 1. Rooms Stats
    let totalCapacity = 0
    if (Array.isArray(settings.roomTypes)) {
      totalCapacity = settings.roomTypes.reduce((sum: number, rt: any) => sum + (Number(rt.count) || 0), 0)
    }
    if (totalCapacity === 0 && rooms.length > 0) {
      totalCapacity = rooms.length
    }

    const occupiedRooms = rooms.filter((r) => r.status === 'OCCUPIED').length
    const cleaningPending = rooms.filter((r) => r.status === 'CLEANING').length
    const vacantRooms = Math.max(0, totalCapacity - occupiedRooms)

    // 2. Checkins / Checkouts (Today)
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Checkins: Invoices created today (proxy)
    const todayCheckins = invoices.filter((inv) => {
      const d = new Date(inv.created_at)
      return d >= startOfDay
    }).length

    // Checkouts: Invoices paid/completed today
    const todayCheckouts = invoices.filter((inv) => {
      // If fully paid today
      if (inv.status === InvoiceStatus.PAID && inv.paid_at) {
          const d = new Date(inv.paid_at);
          return d >= startOfDay;
      }
      return false;
    }).length

    // 3. Revenue
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    let todayRevenue = 0;
    let monthlyRevenue = 0;

    invoices.forEach(inv => {
        // Iterate through all payments (new system)
        if (inv.payments && Array.isArray(inv.payments)) {
            inv.payments.forEach(pay => {
                const payDate = new Date(pay.date);
                if (payDate >= startOfDay) {
                    todayRevenue += (Number(pay.amount) || 0);
                }
                if (payDate >= startOfMonth) {
                    monthlyRevenue += (Number(pay.amount) || 0);
                }
            });
        } 
        // Fallback for legacy data (if status is PAID but no payments array)
        else if (inv.status === 'PAID' && inv.paid_at && (!inv.payments || (inv.payments as any[]).length === 0)) {
             const d = new Date(inv.paid_at);
             if (d >= startOfDay) todayRevenue += (Number(inv.amount) || 0);
             if (d >= startOfMonth) monthlyRevenue += (Number(inv.amount) || 0);
        }
    });

    // 4. Pending Payments: Sum of unpaid balances
    const pendingPayments = invoices.reduce((sum, inv) => {
      if (inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED) {
        // Use balance if available, otherwise full amount (legacy/fallback)
        const balance = typeof inv.balance === 'number' ? inv.balance : inv.amount;
        return sum + (Number(balance) || 0);
      }
      return sum
    }, 0)

    // 5. Food Orders Today
    const foodOrdersToday = orders.filter((o) => {
      const d = new Date(o.created_at)
      return d >= startOfDay
    }).length

    return {
      totalRooms: totalCapacity,
      occupiedRooms,
      vacantRooms,
      cleaningPending,
      todayCheckins,
      todayCheckouts,
      todayRevenue,
      monthlyRevenue,
      pendingPayments,
      foodOrdersToday,
    }
  }
}
