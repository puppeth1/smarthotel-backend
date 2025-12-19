export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
}

export interface Payment {
  id: string;
  amount: number;
  method: 'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER';
  date: Date;
  referenceId?: string;
  collectedBy?: string; // Staff ID or Name
}

export interface Invoice {
  invoice_id: string;
  room_number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  created_at: Date;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  
  // New fields for payment tracking
  paidAmount: number;
  balance: number;
  payments: Payment[];
  
  // Legacy fields (kept for backward compatibility if needed, but should be derived)
  payment_method?: string; 
  paid_at?: Date;
}
