import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    console.log('Aplicación iniciada', process.env.PORT);

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  console.log('Aplicación iniciada', process.env.PORT);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

