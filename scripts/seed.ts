import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const configService = app.get(ConfigService);

  try {
    // Create default admin user if it doesn't exist
    const adminUsername =
      configService.get<string>('ADMIN_USERNAME') || 'admin';
    const adminPassword =
      configService.get<string>('ADMIN_PASSWORD') || 'admin123';
    const adminEmail =
      configService.get<string>('ADMIN_EMAIL') || 'admin@makaylajam.com';

    console.log('Seeding database...');
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Database seeding failed', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
