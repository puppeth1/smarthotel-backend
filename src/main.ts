import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({ origin: 'http://localhost:3001' })
  app.setGlobalPrefix('api')
  const port = process.env.PORT || 8080
  await app.listen(port as number)
}

bootstrap()
