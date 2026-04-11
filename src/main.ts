import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const port = parseInt(process.env.PORT || '3002', 10);

  await app.listen(port);

  console.log(`🚀 Aplicación corriendo en puerto: ${port}`);
}
bootstrap();