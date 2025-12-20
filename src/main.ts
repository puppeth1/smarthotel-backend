import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as express from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(express.json())
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://smarthotel.hypepuppet.com'
    ],
    credentials: true
  })
  const port = process.env.PORT || 8080
  await app.listen(port as number)
}

bootstrap()
