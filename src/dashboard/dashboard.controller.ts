import { Controller, Get, Query } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { HotelsService } from '../hotels/hotels.service'

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService, private readonly hotelsService: HotelsService) {}

  @Get('summary')
  getSummary(@Query('hotelId') hotelId?: string) {
    const hid = hotelId || 'hotel_default'
    const stats = this.dashboardService.getStats(hid)
    const settings = this.hotelsService.getSettings(hid) || {}
    const currency = settings.currency || { code: 'INR', locale: 'en-IN' }
    return {
      currency: {
        code: currency.code,
        locale: currency.locale,
      },
      rooms: {
        total: stats.totalRooms,
        occupied: stats.occupiedRooms,
        vacant: stats.vacantRooms,
        cleaning_pending: stats.cleaningPending,
      },
      today: {
        checkins: stats.todayCheckins,
        checkouts: stats.todayCheckouts,
        food_orders: stats.foodOrdersToday,
      },
      revenue: {
        today: stats.todayRevenue,
        monthly: stats.monthlyRevenue,
        pending: stats.pendingPayments,
      },
    }
  }

  @Get('stats')
  getStats(@Query('hotelId') hotelId?: string) {
    const hid = hotelId || 'hotel_default'
    return this.dashboardService.getStats(hid)
  }
}
