"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const terminus_1 = require("@nestjs/terminus");
const redis_service_1 = require("../../common/cache/redis.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const prisma_service_1 = require("../../database/prisma.service");
let HealthController = class HealthController {
    health;
    prismaHealth;
    memory;
    prisma;
    redisService;
    constructor(health, prismaHealth, memory, prisma, redisService) {
        this.health = health;
        this.prismaHealth = prismaHealth;
        this.memory = memory;
        this.prisma = prisma;
        this.redisService = redisService;
    }
    check() {
        return this.health.check([
            () => this.prismaHealth.pingCheck('database_postgres', this.prisma),
            async () => {
                try {
                    const redis = this.redisService.getClient();
                    const start = Date.now();
                    const pong = await redis.ping();
                    const latencyMs = Date.now() - start;
                    return {
                        redis: {
                            status: pong === 'PONG' ? 'up' : 'down',
                            latencyMs,
                        },
                    };
                }
                catch (e) {
                    const message = e instanceof Error ? e.message : 'Error de conexión con Redis';
                    return {
                        redis: {
                            status: 'down',
                            message,
                        },
                    };
                }
            },
            () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
        ]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Verificar estado de salud de PostgreSQL, Redis, memoria y latencias',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Estado general del sistema y servicios dependientes',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health & Monitoring (Diagnóstico & Resiliencia)'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.PrismaHealthIndicator,
        terminus_1.MemoryHealthIndicator,
        prisma_service_1.PrismaService,
        redis_service_1.RedisCacheService])
], HealthController);
//# sourceMappingURL=health.controller.js.map