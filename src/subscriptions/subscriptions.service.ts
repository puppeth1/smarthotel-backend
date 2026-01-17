import { Injectable } from '@nestjs/common'
import * as admin from 'firebase-admin'
import crypto from 'crypto'
import { Subscription, SubscriptionStatus, PlanType } from './subscription.types'

@Injectable()
export class SubscriptionsService {
  constructor() {
    if (!admin.apps.length) {
      try {
        admin.initializeApp()
      } catch {}
    }
  }

  private col() {
    return admin.firestore().collection('subscriptions')
  }

  async getByUser(userId: string): Promise<Subscription | null> {
    const snap = await this.col().where('user_id', '==', userId).orderBy('updated_at', 'desc').limit(1).get()
    if (snap.empty) return null
    const doc = snap.docs[0]
    return { id: doc.id, ...(doc.data() as any) }
  }

  async createPending(userId: string, plan: PlanType, razorpayCustomerId?: string, razorpaySubscriptionId?: string): Promise<Subscription> {
    const now = Date.now()
    const doc = await this.col().add({
      user_id: userId,
      plan_type: plan,
      status: 'pending',
      razorpay_customer_id: razorpayCustomerId,
      razorpay_subscription_id: razorpaySubscriptionId,
      created_at: now,
      updated_at: now,
    } satisfies Omit<Subscription, 'id'>)
    const snap = await doc.get()
    return { id: doc.id, ...(snap.data() as any) }
  }

  async updateStatus(id: string, status: SubscriptionStatus, fields: Partial<Subscription> = {}) {
    const u = { status, updated_at: Date.now(), ...fields }
    await this.col().doc(id).set(u, { merge: true })
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'smarthotel_webhook_prod_2026'
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return expected === signature
  }

  async handleWebhook(event: any, payloadRaw: string, signature: string) {
    if (!this.verifyWebhookSignature(payloadRaw, signature)) {
      throw new Error('Invalid signature')
    }

    const { event: evType, payload: evPayload } = event
    const sub = evPayload?.subscription?.entity
    const pay = evPayload?.payment?.entity

    // Try to locate subscription record by razorpay_subscription_id or customer_id
    const findBy = async (): Promise<{ id: string } | null> => {
      const sid = sub?.id || pay?.subscription_id
      if (sid) {
        const bySid = await this.col().where('razorpay_subscription_id', '==', sid).limit(1).get()
        if (!bySid.empty) return { id: bySid.docs[0].id }
      }
      const cid = sub?.customer_id || pay?.customer_id
      if (cid) {
        const byCid = await this.col().where('razorpay_customer_id', '==', cid).orderBy('updated_at', 'desc').limit(1).get()
        if (!byCid.empty) return { id: byCid.docs[0].id }
      }
      return null
    }

    const rec = await findBy()
    if (!rec) return

    switch (evType) {
      case 'subscription.activated': {
        const start = sub?.current_start ? Number(sub.current_start) * 1000 : Date.now()
        const end = sub?.current_end ? Number(sub.current_end) * 1000 : undefined
        await this.updateStatus(rec.id, 'active', {
          current_period_start: start,
          current_period_end: end,
          grace_until: undefined,
        })
        break
      }
      case 'subscription.charged': {
        // Keep active; update period end if available
        const end = sub?.current_end ? Number(sub.current_end) * 1000 : undefined
        await this.updateStatus(rec.id, 'active', {
          current_period_end: end,
        })
        break
      }
      case 'subscription.completed': {
        const end = sub?.current_end ? Number(sub.current_end) * 1000 : Date.now()
        await this.updateStatus(rec.id, 'expired', { current_period_end: end })
        break
      }
      case 'subscription.cancelled': {
        const end = sub?.current_end ? Number(sub.current_end) * 1000 : Date.now()
        await this.updateStatus(rec.id, 'cancelled', { current_period_end: end })
        break
      }
      case 'payment.failed': {
        // Optional 24h grace
        const grace = Date.now() + 24 * 60 * 60 * 1000
        await this.updateStatus(rec.id, 'pending', { grace_until: grace })
        break
      }
      default:
        break
    }
  }

  async getAccessStatus(userId: string): Promise<{ status: SubscriptionStatus; current_period_end?: number; allowed: boolean }> {
    const sub = await this.getByUser(userId)
    if (!sub) return { status: 'expired', allowed: false }
    const now = Date.now()
    const active = sub.status === 'active' && (!sub.current_period_end || now <= sub.current_period_end)
    const pendingWithinGrace = sub.status === 'pending' && sub.grace_until !== undefined && now <= sub.grace_until
    const allowed = active || pendingWithinGrace
    return { status: sub.status, current_period_end: sub.current_period_end, allowed }
  }

  async createSubscription(uid: string, email: string | undefined, plan: 'monthly' | 'quarterly' | 'yearly') {
    const RAZORPAY_PLANS = {
      monthly: process.env.RAZORPAY_PLAN_MONTHLY || 'plan_S0c4b2B2UWbIZP',
      quarterly: process.env.RAZORPAY_PLAN_QUARTERLY || 'plan_S0c5iLw0DEGZ1I',
      yearly: process.env.RAZORPAY_PLAN_YEARLY || 'plan_S0c6UPjrKTCFXA',
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_S4DNXXPde92qNa'
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'UT0U4CeV52t3fPUye007kbgZ'
    const base = 'https://api.razorpay.com/v1'
    const auth = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    // Ensure customer
    const customer = await fetch(`${base}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ name: uid, email }),
    }).then(r => r.json())

    const customerId = customer?.id

    const sub = await fetch(`${base}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({
        plan_id: RAZORPAY_PLANS[plan],
        customer_id: customerId,
        total_count: 0,
        // Auto collection
        customer_notify: 1,
        // Start immediately
        start_at: Math.floor(Date.now() / 1000),
      }),
    }).then(r => r.json())

    const saved = await this.createPending(uid || '', plan, customerId, sub?.id)
    return { status: 'success', data: { subscriptionId: sub?.id, customerId, planId: RAZORPAY_PLANS[plan], record: saved } }
  }
}

