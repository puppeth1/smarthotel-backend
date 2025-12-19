import { Body, Controller, Post } from '@nestjs/common'
import { BillingService } from './billing.service'

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  async checkout(@Body() body: any) {
    try {
      const result = await this.billingService.checkout({
        roomNumber: body.roomNumber,
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        payment: body.payment,
        extras: body.extras,
        hotelId: body.hotelId,
        guest: body.guest,
      })
      return { status: 'success', data: result }
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : String(error) }
    }
  }
}

