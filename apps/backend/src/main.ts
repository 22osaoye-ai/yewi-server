import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Configurar límite de payload JSON y urlencoded (25MB para fotos de perfil, avatares y portafolio en Base64)
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  const apiPrefix = configService.get<string>('apiPrefix') ?? 'api/v1';

  // 1. Seguridad con Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permitir Swagger UI
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. Compresión de respuestas
  app.use(compression());

  // 3. CORS
  app.enableCors({
    origin: configService.get<string[]>('cors.origin') ?? '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 4. Prefijo Global
  app.setGlobalPrefix(apiPrefix);

  // 5. Validación global estricta ("blindada")
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 6. Configuración de Documentación OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Yewi Marketplace API')
    .setDescription(
      `API RESTful & WebSockets de Alto Rendimiento para la Plataforma Yewi.
      
      Combina:
      - **Modelo ProntoPro**: Solicitudes geo-localizadas, matching de profesionales con cálculo de radio, desbloqueo de leads incluido en Yewi Pro y cotizaciones.
      - **Modelo Fiverr**: Catálogo de servicios empaquetados (Gigs) con niveles Básico, Estándar y Premium, pedidos directos, entregas, revisiones y Escrow.
      - **Centro Financiero & Seguridad**: Billetera de créditos y saldo fiat, Stripe Connect / PaymentIntents, Escrow con retención y liberación, roles RBAC y filtros anti-fraude.`,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduce tu token JWT de acceso (Access Token)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag(
      'Auth (Autenticación & Seguridad)',
      'Endpoints de registro dual, login con Argon2, refresco de token y logout',
    )
    .addTag(
      'Users (Usuarios & Perfil de Cliente)',
      'Gestión del perfil del cliente y datos personales',
    )
    .addTag(
      'Professionals (Perfiles Pro, Portafolio, Ubicación & KYC)',
      'Perfiles profesionales, coordenadas geográficas, radio de servicio y KYC',
    )
    .addTag(
      'Categories (Categorías & Cuestionarios Dinámicos)',
      'Árbol de categorías y esquemas JSON dinámicos para ProntoPro',
    )
    .addTag(
      'Gigs (Servicios Embalados Estilo Fiverr)',
      'Catálogo de Gigs con paquetes Básico, Estándar y Premium y extras',
    )
    .addTag(
      'Leads & Service Requests (Solicitudes ProntoPro, Matching & Presupuestos)',
      'Publicación de requerimientos, matching por proximidad, desbloqueo incluido en Yewi Pro y presupuestos',
    )
    .addTag(
      'Orders (Gestión de Pedidos, Entregas, Revisiones & Escrow)',
      'Máquina de estados de pedidos, entregas de archivos, revisiones y liberación de fondos',
    )
    .addTag(
      'Wallet & Credits (Billetera, Recarga de Créditos & Retiros)',
      'Monedero de créditos para compras y saldo fiat',
    )
    .addTag(
      'Payments (Pasarela Stripe, Intenciones de Pago & Webhooks)',
      'Pasarela Stripe para cobros y checkout',
    )
    .addTag(
      'Chat (Mensajería en Tiempo Real, Archivos & Anti-Fraude)',
      'Salas de chat por pedido/lead con filtros anti-fraude',
    )
    .addTag(
      'Reviews (Calificaciones, Reseñas Verificadas & Reputación)',
      'Calificaciones multicriterio sobre pedidos finalizados',
    )
    .addTag(
      'Notifications (Notificaciones & Alertas)',
      'Centro de notificaciones y alertas in-app',
    )
    .addTag(
      'Admin (Panel de Control, Métricas GMV, KYC & Disputas)',
      'Panel de administración, métricas GMV, validación de KYC y resolución de disputas',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Yewi API Documentation',
  });

  await app.listen(port, '0.0.0.0');
  const appUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.PUBLIC_APP_URL ||
    `http://localhost:${port}`;

  logger.log(
    `================================================================`,
  );
  logger.log(
    `🚀 Servidor Yewi iniciado exitosamente en: ${appUrl}/${apiPrefix}`,
  );
  logger.log(
    `📚 Documentación Swagger interactiva: ${appUrl}/api/docs`,
  );
  logger.log(
    `================================================================`,
  );
}
void bootstrap();
