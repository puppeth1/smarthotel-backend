export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'pending';
export type PlanType = string;

export interface Subscription {
  id: string;
  userId?: string;
  planId?: string;
  status: SubscriptionStatus;
  startDate?: Date;
  endDate?: Date;

  // DB Fields (compatibility with existing service)
  user_id?: string;
  plan_type?: PlanType;
  razorpay_customer_id?: string;
  razorpay_subscription_id?: string;
  created_at?: number;
  updated_at?: number;
  current_period_start?: number;
  current_period_end?: number;
  grace_until?: number;
}
