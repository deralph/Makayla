import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import helmet from 'helmet';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Global pipes, filters, and interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Makayla Jam API')
    .setDescription(
      [
        'Backend API powering Makayla Jam with gameplay, live-ops, and admin tooling.',
        'Highlights:',
        '- Device and admin authentication with JWT + 2FA support',
        '- Player state sync, coins, missions, invites, leaderboards, tournaments',
        '- Live-ops utilities: shop purchases, boosters, gifting, redeem codes, notifications',
        '- Admin endpoints for content management, bans, analytics, and configuration',
      ].join('\n'),
    )
    .setVersion('1.0')
    .setContact('Makayla Jam Ops', '', 'ops@makaylajam.example')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .setTermsOfService('https://makaylajam.example/terms')
    .addServer('https://api.makaylajam.example', 'Production server')
    .addServer('http://localhost:3000', 'Local development')
    .addBearerAuth()
    .addTag(
      'auth',
      'Authentication for devices and admins, including token refresh and 2FA management.',
    )
    .addTag('users', 'Player profile, state sync, and rank progression endpoints.')
    .addTag('coins', 'Coin ledger adjustments and balance queries.')
    .addTag('shop', 'Purchasing of boosters, multitap upgrades, and energy refills.')
    .addTag('missions', 'Daily and social missions with reward claims and verification.')
    .addTag('leaderboard', 'Global and friend leaderboards with score submissions.')
    .addTag('tournaments', 'Coin-race tournaments with 10-player caps and winners.')
    .addTag('gifting', 'Peer gifting flows and admin audits.')
    .addTag('redeem', 'Admin-managed redeem codes with confirmation flow and gifts.')
    .addTag(
      'notifications',
      'Push token registration and admin-triggered notifications to players.',
    )
    .addTag('admin', 'Administrative tooling for bans, content, analytics, and config.')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  app.getHttpAdapter().get('/api/postman.json', (req, res) => {
    res.type('application/json').send(document);
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();