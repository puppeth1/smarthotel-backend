
import { Body, Controller, Get, Param, Post, StreamableFile, NotFoundException, Res, UseGuards, Req } from '@nestjs/common'
import { BillingService } from './billing.service'
import { StorageService } from './storage.service'
import { createReadStream, existsSync } from 'fs'
import { Response } from 'express'
import { Request } from 'express'
import { FirebaseAuthGuard } from '../auth/firebase.guard'
import { UsersService } from '../users/users.service'

@UseGuards(FirebaseAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(
      private readonly billingService: BillingService,
      private readonly storageService: StorageService,
      private readonly users: UsersService,
  ) {}

  @Get('invoices')
  listInvoices(@Req() req: Request) {
    const uid = (req as any).user?.id as string | undefined
    const hid = uid ? this.users.getHotelForUser(uid) || undefined : undefined
    return { status: 'success', data: this.billingService.listInvoices(hid) }
  }

  @Post('/checkout')
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
      });
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @Post('invoices/generate')
  async generateInvoice(@Body() body: { roomNumber: string, template?: string, hotelId?: string }) {
      try {
          const result = await this.billingService.generateInvoicePdf(body.roomNumber, body.template, body.hotelId);
          return { status: 'success', data: result };
      } catch (error) {
          return { status: 'error', message: error.message };
      }
  }

  @Get('invoices/download/:filename')
  getInvoicePdf(@Param('filename') filename: string, @Res({ passthrough: true }) res: Response): StreamableFile {
      const filePath = this.storageService.getFilePath(filename);
      if (!existsSync(filePath)) {
          throw new NotFoundException('Invoice not found');
      }
      const file = createReadStream(filePath);
      res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
      });
      return new StreamableFile(file);
  }

  @Post('invoices/:id/payments')
  recordPayment(@Param('id') id: string, @Body() body: any) {
      // body: { amount: number, method: string, referenceId?: string, collectedBy?: string }
      const invoice = this.billingService.recordPayment(id, {
          amount: body.amount,
          method: body.method,
          referenceId: body.referenceId,
          collectedBy: body.collectedBy,
          date: body.date ? new Date(body.date) : undefined
      });

      if (!invoice) {
          return { status: 'error', message: 'Invoice not found or invalid state' };
      }

      return { status: 'success', data: invoice };
  }
}
