"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const cache_module_1 = require("./common/cache/cache.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const transform_response_interceptor_1 = require("./common/interceptors/transform-response.interceptor");
const configuration_1 = __importDefault(require("./config/configuration"));
const env_validation_1 = require("./config/env.validation");
const prisma_module_1 = require("./database/prisma.module");
const admin_module_1 = require("./modules/admin/admin.module");
const auth_module_1 = require("./modules/auth/auth.module");
const categories_module_1 = require("./modules/categories/categories.module");
const chat_module_1 = require("./modules/chat/chat.module");
const gigs_module_1 = require("./modules/gigs/gigs.module");
const health_module_1 = require("./modules/health/health.module");
const leads_module_1 = require("./modules/leads/leads.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const orders_module_1 = require("./modules/orders/orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const professionals_module_1 = require("./modules/professionals/professionals.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const users_module_1 = require("./modules/users/users.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                validationSchema: env_validation_1.envValidationSchema,
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => [
                    {
                        ttl: configService.get('throttle.ttl') ?? 60,
                        limit: configService.get('throttle.limit') ?? 100,
                    },
                ],
                inject: [config_1.ConfigService],
            }),
            prisma_module_1.PrismaModule,
            cache_module_1.CacheModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            professionals_module_1.ProfessionalsModule,
            categories_module_1.CategoriesModule,
            gigs_module_1.GigsModule,
            leads_module_1.LeadsModule,
            orders_module_1.OrdersModule,
            wallet_module_1.WalletModule,
            payments_module_1.PaymentsModule,
            chat_module_1.ChatModule,
            reviews_module_1.ReviewsModule,
            notifications_module_1.NotificationsModule,
            admin_module_1.AdminModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: transform_response_interceptor_1.TransformResponseInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.AllExceptionsFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map