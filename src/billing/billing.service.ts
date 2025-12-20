
import { Injectable } from '@nestjs/common'
import { HotelsService } from '../hotels/hotels.service'
import { OrdersService } from '../orders/orders.service'
import { RoomsService } from '../rooms/rooms.service'
import { ReservationsService } from '../reservations/reservations.service'
import { PdfService } from './pdf.service'
import { StorageService } from './storage.service'
import { Invoice, InvoiceStatus, Payment } from './billing.types'

@Injectable()
export class BillingService {
  private invoicesByHotel: Record<string, Invoice[]> = {}

  constructor(
    private readonly hotelsService: HotelsService,
    private readonly ordersService: OrdersService,
    private readonly roomsService: RoomsService,
    private readonly reservationsService: ReservationsService,
    private readonly pdfService: PdfService,
    private readonly storageService: StorageService,
  ) {}

  generateRoomBill(room: any, hotelId?: string) {
    const hid = hotelId || 'hotel_default'
    if (!this.invoicesByHotel[hid]) this.invoicesByHotel[hid] = []

    // 1. Get Hotel Name & Calculate Prefix
    const hotel = this.hotelsService.getById(hid) || this.hotelsService.getActive()
    const hotelName = hotel?.name || 'SmartHotel'
    const prefix = (hotelName.slice(0, 3).toUpperCase() || 'SMA') + '-INV-'

    // 2. Get Next Invoice Number from Settings
    const settings = this.hotelsService.getSettings(hid) || {}
    let nextNo = settings.nextInvoiceNumber
    if (typeof nextNo !== 'number') nextNo = 1

    // 3. Generate Invoice ID
    const invoiceId = `${prefix}${String(nextNo).padStart(4, '0')}`

    // 4. Increment & Save Next Number
    this.hotelsService.saveSettings(hid, { nextInvoiceNumber: nextNo + 1 })

    const currencyCode = settings?.currency?.code || 'INR'
    const baseAmount = Number(room.price_per_night) || 0
    const taxCfg = settings?.tax || {}
    const taxEnabled = !!taxCfg?.enabled && typeof taxCfg?.percentage === 'number' && taxCfg.percentage > 0
    const taxAmount = taxEnabled ? Math.round(baseAmount * (taxCfg.percentage / 100)) : 0
    const totalAmount = baseAmount + taxAmount

    const invoice: Invoice = {
      invoice_id: invoiceId,
      room_number: room.room_number,
      amount: totalAmount,
      currency: currencyCode,
      status: InvoiceStatus.GENERATED,
      created_at: new Date(),
      subtotal: baseAmount,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      payments: []
    }
    this.invoicesByHotel[hid].push(invoice)
    return invoice
  }

  listInvoices(hotelId?: string) {
    if (hotelId) return this.invoicesByHotel[hotelId] || []
    return Object.values(this.invoicesByHotel).flat()
  }

  getInvoice(invoiceId: string, hotelId?: string) {
    const list = this.listInvoices(hotelId);
    return list.find(i => i.invoice_id === invoiceId);
  }

  recordPayment(invoiceId: string, paymentData: { amount: number, method: 'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER', referenceId?: string, collectedBy?: string, date?: Date }, hotelId?: string) {
    const invoice = this.getInvoice(invoiceId, hotelId);
    if (!invoice) return null;

    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
      if (invoice.status === InvoiceStatus.CANCELLED) return null;
    }

    const payment: Payment = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: Number(paymentData.amount),
      method: paymentData.method,
      date: paymentData.date || new Date(),
      referenceId: paymentData.referenceId,
      collectedBy: paymentData.collectedBy
    };

    if (!invoice.payments) invoice.payments = [];
    invoice.payments.push(payment);

    invoice.paidAmount = (invoice.paidAmount || 0) + payment.amount;
    invoice.balance = invoice.amount - invoice.paidAmount;

    // Update status
    if (invoice.balance <= 0) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paid_at = new Date(); // Legacy support
      invoice.payment_method = payment.method; // Legacy support (last method)
    } else {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    return invoice;
  }

  async generateInvoicePdf(roomNumber: string, template: string = 'classic_gst', hotelId?: string) {
    const hid = hotelId || 'hotel_default';
    
    // 1. Get Room Details
    const rooms = this.roomsService.listRooms(hid);
    const room = rooms.find(r => r.room_number === roomNumber);
    if (!room) throw new Error('Room not found');

    // 2. Get Orders (All active orders for this room)
    const allOrders = this.ordersService.listOrders(hid);
    const roomOrders = allOrders.filter(o => o.room_number === roomNumber && o.status !== 'CANCELLED');
    
    // 3. Prepare Data
    const hotel = this.hotelsService.getById(hid) || this.hotelsService.getActive();
    const settings = this.hotelsService.getSettings(hid) || {};
    
    const roomPrice = Number(room.price_per_night) || 0;
    const ordersTotal = roomOrders.reduce((sum, order) => {
        return sum + order.items.reduce((s: number, i: any) => s + ((Number(i.price)||0) * (Number(i.quantity)||1)), 0);
    }, 0);
    
    const subtotal = roomPrice + ordersTotal;
    const taxCfg = settings?.tax || {};
    const taxEnabled = !!taxCfg?.enabled && typeof taxCfg?.percentage === 'number' && taxCfg.percentage > 0;
    const taxAmount = taxEnabled ? Math.round(subtotal * (taxCfg.percentage / 100)) : 0;
    const totalAmount = subtotal + taxAmount;
    
    // 4. Create Invoice Record
    const hotelName = hotel?.name || 'SmartHotel';
    const prefix = (hotelName.slice(0, 3).toUpperCase() || 'SMA') + '-INV-';
    let nextNo = settings.nextInvoiceNumber;
    if (typeof nextNo !== 'number') nextNo = 1;
    const invoiceId = `${prefix}${String(nextNo).padStart(4, '0')}`;
    this.hotelsService.saveSettings(hid, { nextInvoiceNumber: nextNo + 1 });
    
    const invoice: Invoice = {
        invoice_id: invoiceId,
        room_number: roomNumber,
        amount: totalAmount,
        currency: settings?.currency?.code || 'INR',
        status: InvoiceStatus.GENERATED,
        created_at: new Date(),
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        balance: totalAmount,
        payments: []
    };
    
    if (!this.invoicesByHotel[hid]) this.invoicesByHotel[hid] = [];
    this.invoicesByHotel[hid].push(invoice);
    
    // 5. Generate PDF
    const templateData = {
        invoice,
        hotel: { ...hotel, taxPercentage: taxCfg.percentage },
        guest: { name: 'Guest', phone: '' }, // Placeholder until Guest Management is added
        room,
        orders: roomOrders,
        nights: 1 // Default to 1 for generation view
    };
    
    const pdfBuffer = await this.pdfService.generateInvoicePdf(templateData);
    const filename = `${invoiceId}.pdf`;
    await this.storageService.saveFile(filename, pdfBuffer);
    
    // Return API URL
    const pdfUrl = `/billing/invoices/download/${filename}`;
    
    return {
        invoiceId,
        pdfUrl,
        invoice
    };
  }

  async checkout(payload: {
    type?: 'ROOM' | 'FOOD' | 'MANUAL',
    roomNumber?: string,
    checkIn?: string,
    checkOut?: string,
    payment: { method: 'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER', amount: number },
    extras?: Array<{ description: string, amount: number }>,
    hotelId?: string,
    guest?: { name?: string, phone?: string },
    orderIds?: string[],
    items?: Array<{ description: string, amount: number }>,
    bookingId?: string // NEW: Booking ID for existing reservations
  }) {
    const hid = payload.hotelId || 'hotel_default';
    const type = payload.type || 'ROOM';

    let room = null;
    let roomOrders: any[] = [];
    let nights = 0;
    let roomTotal = 0;
    let ordersTotal = 0;

    // Type Specific Logic
    if (type === 'ROOM') {
      if (!payload.roomNumber) throw new Error('Room number required for Room Checkout');
      const rooms = this.roomsService.listRooms(hid);
      room = rooms.find(r => r.room_number === payload.roomNumber);
      if (!room) throw new Error('Room not found');

      // Orders for room
      const allOrders = this.ordersService.listOrders(hid);
      roomOrders = allOrders.filter(o => o.room_number === payload.roomNumber && o.status !== 'CANCELLED');

      // Nights calculation
      if (payload.checkIn && payload.checkOut) {
        const ci = new Date(payload.checkIn);
        const co = new Date(payload.checkOut);
        const msPerDay = 24 * 60 * 60 * 1000;
        nights = Math.max(1, Math.round((co.getTime() - ci.getTime()) / msPerDay));
      } else {
        nights = 1;
      }

      const pricePerNight = Number(room.price_per_night) || 0;
      roomTotal = pricePerNight * nights;
      
      ordersTotal = roomOrders.reduce((sum, order) => (
        sum + order.items.reduce((s: number, i: any) => s + ((Number(i.price)||0) * (Number(i.quantity)||1)), 0)
      ), 0);

      // COMPLETE BOOKING IF EXISTS
      if (payload.bookingId) {
        try {
            await this.reservationsService.complete(payload.bookingId, hid);
        } catch (e) {
            console.error('Failed to complete reservation', e);
            // Non-blocking? Or should we block? 
            // Blocking is safer to ensure consistency.
        }
      }

    } else if (type === 'FOOD') {
      if (payload.orderIds && payload.orderIds.length > 0) {
        const allOrders = this.ordersService.listOrders(hid);
        roomOrders = allOrders.filter(o => payload.orderIds?.includes(o.id));
        
        ordersTotal = roomOrders.reduce((sum, order) => (
          sum + order.items.reduce((s: number, i: any) => s + ((Number(i.price)||0) * (Number(i.quantity)||1)), 0)
        ), 0);
      }
    } else if (type === 'MANUAL') {
       // Manual items are handled via extras
    }

    const settings = this.hotelsService.getSettings(hid) || {};
    const taxCfg = settings?.tax || {};
    const taxEnabled = !!taxCfg?.enabled && typeof taxCfg?.percentage === 'number' && taxCfg.percentage > 0;

    // Extras (Manual Items or Extras)
    const extrasTotal = (payload.extras || []).reduce((sum, ex) => sum + (Number(ex.amount)||0), 0);
    const subtotal = roomTotal + ordersTotal + extrasTotal;
    const taxAmount = taxEnabled ? Math.round(subtotal * (taxCfg.percentage / 100)) : 0;
    const totalAmount = subtotal + taxAmount;

    // Invoice number
    const hotel = this.hotelsService.getById(hid) || this.hotelsService.getActive();
    const hotelName = hotel?.name || 'SmartHotel';
    const prefix = (hotelName.slice(0, 3).toUpperCase() || 'SMA') + '-INV-';
    let nextNo = settings.nextInvoiceNumber;
    if (typeof nextNo !== 'number') nextNo = 1;
    const invoiceId = `${prefix}${String(nextNo).padStart(4, '0')}`;
    this.hotelsService.saveSettings(hid, { nextInvoiceNumber: nextNo + 1 });

    const invoice: Invoice = {
      invoice_id: invoiceId,
      room_number: payload.roomNumber || '', // Optional now
      amount: totalAmount,
      currency: settings?.currency?.code || 'INR',
      status: InvoiceStatus.GENERATED,
      created_at: new Date(),
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      payments: []
    };

    // Process Payment
    if (payload.payment && Number(payload.payment.amount) > 0) {
      const payment: Payment = {
        id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        amount: Number(payload.payment.amount),
        method: payload.payment.method,
        date: new Date(),
      };
      invoice.payments.push(payment);
      invoice.paidAmount = payment.amount;
      invoice.balance = Math.max(0, invoice.amount - invoice.paidAmount);
      
      invoice.status = invoice.balance <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;
      if (invoice.status === InvoiceStatus.PAID) {
          invoice.paid_at = new Date();
          invoice.payment_method = payload.payment.method;
      }
    }

    if (!this.invoicesByHotel[hid]) this.invoicesByHotel[hid] = [];
    this.invoicesByHotel[hid].push(invoice);

    // Post-Checkout Cleanup
    if (type === 'ROOM' && payload.roomNumber) {
      // Mark room as VACANT
      this.roomsService.updateRoomStatus(payload.roomNumber, 'VACANT', hid);
    }
    
    // Mark orders as paid
    if (roomOrders.length > 0) {
      roomOrders.forEach(o => {
        this.ordersService.updateStatus(o.id, 'PAID', hid);
      });
    }

    return { invoiceId, invoice };
  }
}
