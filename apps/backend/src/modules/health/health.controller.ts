import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { RedisCacheService } from '../../common/cache/redis.service';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Health & Monitoring (Diagnóstico & Resiliencia)')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private prisma: PrismaService,
    private redisService: RedisCacheService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary:
      'Verificar estado de salud de PostgreSQL, Redis, memoria y latencias',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado general del sistema y servicios dependientes',
  })
  check() {
    return this.health.check([
      // 1. Verificar PostgreSQL + PostGIS
      () => this.prismaHealth.pingCheck('database_postgres', this.prisma),

      // 2. Verificar Redis
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
        } catch (e: unknown) {
          const message =
            e instanceof Error ? e.message : 'Error de conexión con Redis';
          return {
            redis: {
              status: 'down',
              message,
            },
          };
        }
      },

      // 3. Verificar Memoria Heap (Límite 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // 4. Verificar Memoria RSS (Límite 500MB)
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
    ]);
  }
}
