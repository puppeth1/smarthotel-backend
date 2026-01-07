export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
}
