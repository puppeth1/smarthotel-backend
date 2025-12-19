
import { Invoice } from '../billing.types';

export interface InvoiceTemplateData {
  invoice: Invoice;
  hotel: any;
  guest: any; // Name, etc.
  room: any; // Room details
  orders: any[]; // Food orders
  nights?: number;
  extras?: Array<{ description: string; amount: number }>;
}

const formatMoney = (amount: number, currency: string = 'INR', locale: string = 'en-IN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Base styles for all templates
const baseCss = `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
  .logo { font-size: 24px; font-weight: bold; color: #2c3e50; text-transform: uppercase; letter-spacing: 1px; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 32px; font-weight: 300; color: #7f8c8d; margin-bottom: 10px; text-transform: uppercase; }
  .bill-to { margin-bottom: 30px; }
  .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  .table th { background: #f8f9fa; color: #2c3e50; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #ddd; }
  .table td { padding: 12px; border-bottom: 1px solid #eee; }
  .amount-col { text-align: right; }
  .totals { display: flex; justify-content: flex-end; }
  .totals-table { width: 300px; }
  .totals-table td { padding: 8px; text-align: right; }
  .total-row { font-size: 18px; font-weight: bold; border-top: 2px solid #333; }
  .footer { margin-top: 50px; text-align: center; color: #7f8c8d; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
  .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
  .status-paid { background: #d4edda; color: #155724; }
  .status-pending { background: #fff3cd; color: #856404; }
`;

export const classicGstTemplate = (data: InvoiceTemplateData) => {
  const { invoice, hotel, guest, room, orders, nights = 1, extras = [] } = data;
  const currency = invoice.currency || 'INR';
  const locale = 'en-IN'; // Should come from hotel settings in real app

  // Calculate items
  const pricePerNight = room ? (Number(room.price_per_night) || 0) : 0;
  const roomTotal = pricePerNight * Number(nights);
  // Flatten order items
  const orderItems = orders.flatMap(o => o.items.map((i: any) => ({ ...i, date: o.created_at })));

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>${baseCss}</style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">${hotel.name}</div>
            <div style="margin-top: 10px; font-size: 14px; color: #666;">
              ${hotel.address || 'Address Line 1'}<br>
              ${hotel.city || 'City'}, ${hotel.zip || '000000'}<br>
              GSTIN: ${hotel.gstin || 'N/A'}<br>
              Phone: ${hotel.phone || 'N/A'}
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-title">Tax Invoice</div>
            <div><strong>Invoice #:</strong> ${invoice.invoice_id}</div>
            <div><strong>Date:</strong> ${formatDate(invoice.created_at)}</div>
            <div style="margin-top: 10px;">
              <span class="status-badge ${invoice.status === 'PAID' ? 'status-paid' : 'status-pending'}">
                ${invoice.status}
              </span>
            </div>
          </div>
        </div>

        <div class="bill-to">
          <h3 style="margin-bottom: 10px; font-size: 14px; text-transform: uppercase; color: #999;">Bill To</h3>
          <strong>${guest.name || 'Guest'}</strong><br>
          ${invoice.room_number ? `Room: ${invoice.room_number}<br>` : ''}
          ${guest.phone || ''}
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th style="width: 15%;">Qty</th>
              <th class="amount-col">Price</th>
              <th class="amount-col">Total</th>
            </tr>
          </thead>
          <tbody>
            ${room ? `
            <tr>
              <td>
                <strong>Room Charge</strong><br>
                <span style="font-size: 12px; color: #666;">${room.type} Room @ ${formatMoney(pricePerNight, currency, locale)}/night</span>
              </td>
              <td>${nights} Night${nights > 1 ? 's' : ''}</td>
              <td class="amount-col">${formatMoney(pricePerNight, currency, locale)}</td>
              <td class="amount-col">${formatMoney(roomTotal, currency, locale)}</td>
            </tr>
            ` : ''}
            ${orderItems.map((item: any) => `
              <tr>
                <td>${item.name} <span style="font-size: 12px; color: #999;">(${formatDate(item.date)})</span></td>
                <td>${item.quantity || 1}</td>
                <td class="amount-col">${formatMoney(item.price || 0, currency, locale)}</td>
                <td class="amount-col">${formatMoney((item.price || 0) * (item.quantity || 1), currency, locale)}</td>
              </tr>
            `).join('')}
            ${extras.map((ex) => `
              <tr>
                <td>${ex.description}</td>
                <td>—</td>
                <td class="amount-col">${formatMoney(ex.amount || 0, currency, locale)}</td>
                <td class="amount-col">${formatMoney(ex.amount || 0, currency, locale)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td>${formatMoney(invoice.subtotal || 0, currency, locale)}</td>
            </tr>
            <tr>
              <td>Tax (${hotel.taxPercentage || 0}%)</td>
              <td>${formatMoney(invoice.taxAmount || 0, currency, locale)}</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td>${formatMoney(invoice.totalAmount || 0, currency, locale)}</td>
            </tr>
            ${invoice.paidAmount > 0 ? `
            <tr>
              <td>Paid</td>
              <td>${formatMoney(invoice.paidAmount, currency, locale)}</td>
            </tr>
            <tr>
              <td>Balance</td>
              <td>${formatMoney(invoice.balance, currency, locale)}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div class="footer">
          <p>Thank you for staying with us!</p>
          <p>This is a computer generated invoice.</p>
        </div>
      </body>
    </html>
  `;
};

export const hotelDetailedTemplate = (data: InvoiceTemplateData) => {
    // Re-use logic for now, can be customized later
    return classicGstTemplate(data).replace('Tax Invoice', 'Detailed Invoice');
};

export const hotelRestaurantTemplate = (data: InvoiceTemplateData) => {
    return classicGstTemplate(data).replace('Tax Invoice', 'Restaurant Invoice');
};

export const minimalTemplate = (data: InvoiceTemplateData) => {
    // Simplified CSS could go here
    return classicGstTemplate(data).replace('Tax Invoice', 'Invoice');
};
