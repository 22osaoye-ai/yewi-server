"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('port') ?? 3000;
    const apiPrefix = configService.get('apiPrefix') ?? 'api/v1';
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    app.use((0, compression_1.default)());
    app.enableCors({
        origin: configService.get('cors.origin') ?? '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Yewi Marketplace API')
        .setDescription(`API RESTful & WebSockets de Alto Rendimiento para la Plataforma Yewi.
      
      Combina:
      - **Modelo ProntoPro**: Solicitudes geo-localizadas, matching de profesionales con cálculo de radio, desbloqueo de leads con saldo de créditos y cotizaciones.
      - **Modelo Fiverr**: Catálogo de servicios empaquetados (Gigs) con niveles Básico, Estándar y Premium, pedidos directos, entregas, revisiones y Escrow.
      - **Centro Financiero & Seguridad**: Billetera de créditos y saldo fiat, Stripe Connect / PaymentIntents, Escrow con retención y liberación, roles RBAC y filtros anti-fraude.`)
        .setVersion('1.0.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduce tu token JWT de acceso (Access Token)',
        in: 'header',
    }, 'JWT-auth')
        .addTag('Auth (Autenticación & Seguridad)', 'Endpoints de registro dual, login con Argon2, refresco de token y logout')
        .addTag('Users (Usuarios & Perfil de Cliente)', 'Gestión del perfil del cliente y datos personales')
        .addTag('Professionals (Perfiles Pro, Portafolio, Ubicación & KYC)', 'Perfiles profesionales, coordenadas geográficas, radio de servicio y KYC')
        .addTag('Categories (Categorías & Cuestionarios Dinámicos)', 'Árbol de categorías y esquemas JSON dinámicos para ProntoPro')
        .addTag('Gigs (Servicios Embalados Estilo Fiverr)', 'Catálogo de Gigs con paquetes Básico, Estándar y Premium y extras')
        .addTag('Leads & Service Requests (Solicitudes ProntoPro, Matching & Presupuestos)', 'Publicación de requerimientos, matching por proximidad, desbloqueo con créditos y presupuestos')
        .addTag('Orders (Gestión de Pedidos, Entregas, Revisiones & Escrow)', 'Máquina de estados de pedidos, entregas de archivos, revisiones y liberación de fondos')
        .addTag('Wallet & Credits (Billetera, Recarga de Créditos & Retiros)', 'Monedero de créditos para leads y saldo fiat')
        .addTag('Payments (Pasarela Stripe, Intenciones de Pago & Webhooks)', 'Pasarela Stripe para cobros y checkout')
        .addTag('Chat (Mensajería en Tiempo Real, Archivos & Anti-Fraude)', 'Salas de chat por pedido/lead con filtros anti-fraude')
        .addTag('Reviews (Calificaciones, Reseñas Verificadas & Reputación)', 'Calificaciones multicriterio sobre pedidos finalizados')
        .addTag('Notifications (Notificaciones & Alertas)', 'Centro de notificaciones y alertas in-app')
        .addTag('Admin (Panel de Control, Métricas GMV, KYC & Disputas)', 'Panel de administración, métricas GMV, validación de KYC y resolución de disputas')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
        customSiteTitle: 'Yewi API Documentation',
    });
    await app.listen(port, '0.0.0.0');
    logger.log(`================================================================`);
    logger.log(`🚀 Servidor Yewi iniciado exitosamente en: http://localhost:${port}/${apiPrefix}`);
    logger.log(`📚 Documentación Swagger interactiva: http://localhost:${port}/api/docs`);
    logger.log(`================================================================`);
}
void bootstrap();
//# sourceMappingURL=main.js.map