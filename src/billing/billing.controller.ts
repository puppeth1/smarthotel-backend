import { Controller, Get } from '@nestjs/common'
import { BillingService } from './billing.service'

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  listInvoices() {
    return { status: 'success', data: this.billingService.listInvoices() }
  }
}
