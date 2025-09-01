import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  
  await app.listen(port);
  console.log(`Backend đang chạy tại: http://localhost:${port}`);
}
bootstrap();
