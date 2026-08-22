import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisCacheService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private client;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    getClient(): Redis;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    acquireLock(resource: string, ttlSeconds?: number): Promise<string | null>;
    releaseLock(resource: string, token: string): Promise<boolean>;
}
