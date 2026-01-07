import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { Request, Response } from 'express'
import { SubscriptionsService } from './subscriptions.service'
import { FirebaseAuthGuard } from '../auth/firebase.guard'

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get('status')
  async status(@Req() req: Request) {
    const uid = (req as any).user?.id as string | undefined
    const userId = uid || ''
    const s = await this.subs.getAccessStatus(userId)
    return { status: 'success', data: s }
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('create')
  async create(@Req() req: Request, @Body() body: any) {
    const uid = (req as any).user?.id as string | undefined
    const plan: 'monthly' | 'quarterly' | 'yearly' = body?.plan_type || 'monthly'
    return this.subs.createSubscription(uid || '', (req as any).user?.email, plan)
  }

  @Post('webhook')
  async webhook(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    const signature = (req.headers['x-razorpay-signature'] as string) || ''
    const payloadRaw = JSON.stringify(body)
    try {
      await this.subs.handleWebhook(body, payloadRaw, signature)
      res.status(200).send({ status: 'ok' })
    } catch (e) {
      res.status(400).send({ status: 'error', message: 'Invalid signature' })
    }
  }
}

@Controller('subscription')
export class SubscriptionControllerAlias {
  constructor(private readonly subs: SubscriptionsService) {}

  @UseGuards(FirebaseAuthGuard)
  @Post('create')
  createAlias(@Req() req: Request, @Body() body: any) {
    const uid = (req as any).user?.id as string | undefined
    const plan: 'monthly' | 'quarterly' | 'yearly' = body?.plan_type || 'monthly'
    return this.subs.createSubscription(uid || '', (req as any).user?.email, plan)
  }
}
