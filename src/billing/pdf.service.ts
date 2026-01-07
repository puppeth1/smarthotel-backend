import { Injectable, Logger } from '@nestjs/common';
const PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateInvoicePdf(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (buffer: Buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: Error) => reject(err));

        // Header
        doc.fontSize(20).text(data.hotel?.name || 'Smart Hotel', { align: 'center' });
        doc.fontSize(10).text(data.hotel?.address?.line || '', { align: 'center' });
        doc.text(`${data.hotel?.address?.city || ''}, ${data.hotel?.address?.state || ''}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('INVOICE', { align: 'center', underline: true });
        doc.moveDown();

        // Meta Info
        const yStart = doc.y;
        doc.fontSize(10);
        doc.text(`Guest: ${data.guest?.name || 'Guest'}`, 50, yStart);
        if (data.guest?.phone) doc.text(`Phone: ${data.guest?.phone}`);
        if (data.room?.room_number) doc.text(`Room: ${data.room?.room_number}`);
        doc.text(`Invoice #: ${data.invoice?.invoice_id}`, 300, yStart, { align: 'right' });
        doc.text(`Date: ${new Date(data.invoice?.created_at).toLocaleDateString()}`, 300, doc.y, { align: 'right' });
        doc.text(`Status: ${data.invoice?.status}`, 300, doc.y, { align: 'right' });

        // Table Header
        const tableTop = doc.y + 20;
        const itemX = 50;
        const qtyX = 300;
        const priceX = 380;
        const totalX = 480;
        
        doc.font('Helvetica-Bold');
        doc.text('Item / Description', itemX, tableTop);
        doc.text('Qty', qtyX, tableTop);
        doc.text('Price', priceX, tableTop);
        doc.text('Total', totalX, tableTop);
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        doc.font('Helvetica');
        
        // Line Items
        let y = tableTop + 25;
        
        // Room Charges
        if (data.nights && data.room) {
            const roomPrice = Number(data.room.price_per_night) || 0;
            const total = roomPrice * data.nights;
            doc.text(`Room Charges (${data.nights} Nights)`, itemX, y);
            doc.text(`${data.nights}`, qtyX, y);
            doc.text(roomPrice.toFixed(2), priceX, y);
            doc.text(total.toFixed(2), totalX, y);
            y += 20;
        }

        // Orders
        if (data.orders && data.orders.length > 0) {
            data.orders.forEach((order: any) => {
                order.items.forEach((item: any) => {
                    const price = Number(item.price) || 0;
                    const qty = Number(item.quantity) || 1;
                    const total = price * qty;
                    doc.text(`${item.name || item.description || 'Item'}`, itemX, y);
                    doc.text(`${qty}`, qtyX, y);
                    doc.text(price.toFixed(2), priceX, y);
                    doc.text(total.toFixed(2), totalX, y);
                    y += 20;
                });
            });
        }

        // Extras
        if (data.extras && data.extras.length > 0) {
             data.extras.forEach((ex: any) => {
                 const amount = Number(ex.amount) || 0;
                 doc.text(`${ex.description || 'Extra'}`, itemX, y);
                 doc.text(`1`, qtyX, y);
                 doc.text(amount.toFixed(2), priceX, y);
                 doc.text(amount.toFixed(2), totalX, y);
                 y += 20;
             });
        }

        doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();
        y += 15;

        // Totals
        const totalLabelX = 380;
        const totalValueX = 480;
        doc.text('Subtotal:', totalLabelX, y);
        doc.text((data.invoice?.subtotal || 0).toFixed(2), totalValueX, y);
        y += 20;
        if (data.invoice?.taxAmount > 0) {
            doc.text(`Tax (${data.hotel?.taxPercentage || 0}%):`, totalLabelX, y);
            doc.text((data.invoice?.taxAmount || 0).toFixed(2), totalValueX, y);
            y += 20;
        }
        doc.font('Helvetica-Bold');
        doc.text('Total:', totalLabelX, y);
        doc.text((data.invoice?.totalAmount || 0).toFixed(2), totalValueX, y);
        y += 25;

        // Footer
        doc.fontSize(10).font('Helvetica-Oblique');
        doc.text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

        doc.end();
      } catch (error) {
        this.logger.error('Error generating PDF', error);
        reject(error);
      }
    });
  }
}
