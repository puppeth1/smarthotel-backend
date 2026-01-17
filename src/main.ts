import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as admin from 'firebase-admin'
import * as bodyParser from 'body-parser'

async function bootstrap() {
  // Firebase Admin (Cloud Run)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'smarthotel-392319',
    })
  }

  const app = await NestFactory.create(AppModule)

  // ✅ JSON for normal API routes
  app.use(bodyParser.json())

  // ✅ RAW BODY ONLY for Razorpay webhook
  app.use(
    '/subscriptions/webhook',
    bodyParser.raw({ type: 'application/json' })
  )

  // ✅ Proper NestJS CORS (NO manual headers)
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://smarthotel.highpuppet.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  await app.listen(process.env.PORT || 8080)
}

bootstrap()
