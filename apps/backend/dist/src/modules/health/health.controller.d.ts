import { HealthCheckService, MemoryHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';
import { RedisCacheService } from '../../common/cache/redis.service';
import { PrismaService } from '../../database/prisma.service';
export declare class HealthController {
    private health;
    private prismaHealth;
    private memory;
    private prisma;
    private redisService;
    constructor(health: HealthCheckService, prismaHealth: PrismaHealthIndicator, memory: MemoryHealthIndicator, prisma: PrismaService, redisService: RedisCacheService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<(import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"memory_rss"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & ({
        redis: {
            status: "up" | "down";
            latencyMs: number;
            message?: undefined;
        };
    } | {
        redis: {
            status: "down";
            message: string;
            latencyMs?: undefined;
        };
    })) & import("@nestjs/terminus").HealthIndicatorResult<"database_postgres">, Partial<(import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"memory_rss"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & ({
        redis: {
            status: "up" | "down";
            latencyMs: number;
            message?: undefined;
        };
    } | {
        redis: {
            status: "down";
            message: string;
            latencyMs?: undefined;
        };
    })) & import("@nestjs/terminus").HealthIndicatorResult<"database_postgres">> | undefined, Partial<(import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"memory_rss"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & ({
        redis: {
            status: "up" | "down";
            latencyMs: number;
            message?: undefined;
        };
    } | {
        redis: {
            status: "down";
            message: string;
            latencyMs?: undefined;
        };
    })) & import("@nestjs/terminus").HealthIndicatorResult<"database_postgres">> | undefined>>;
}
