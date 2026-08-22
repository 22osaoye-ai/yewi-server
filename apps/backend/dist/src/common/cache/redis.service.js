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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisCacheService = RedisCacheService_1 = class RedisCacheService {
    configService;
    logger = new common_1.Logger(RedisCacheService_1.name);
    client;
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        const host = this.configService.get('redis.host') ?? 'localhost';
        const port = this.configService.get('redis.port') ?? 6379;
        const password = this.configService.get('redis.password');
        this.client = new ioredis_1.default({
            host,
            port,
            password: password || undefined,
            retryStrategy: (times) => {
                const delay = Math.min(times * 100, 3000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });
        this.client.on('connect', () => {
            this.logger.log(`Conexión establecida con Redis en ${host}:${port}`);
        });
        this.client.on('error', (err) => {
            this.logger.warn(`Aviso de conexión Redis: ${err.message}`);
        });
    }
    onModuleDestroy() {
        if (this.client) {
            this.client.disconnect();
        }
    }
    getClient() {
        return this.client;
    }
    async get(key) {
        try {
            const data = await this.client.get(key);
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds = 300) {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds > 0) {
                await this.client.set(key, serialized, 'EX', ttlSeconds);
            }
            else {
                await this.client.set(key, serialized);
            }
        }
        catch {
            this.logger.warn(`Error al escribir en caché key ${key}`);
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch {
            this.logger.warn(`Error al eliminar caché key ${key}`);
        }
    }
    async delPattern(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        }
        catch {
            this.logger.warn(`Error al limpiar patrón de caché ${pattern}`);
        }
    }
    async acquireLock(resource, ttlSeconds = 10) {
        const token = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const lockKey = `lock:${resource}`;
        try {
            const result = await this.client.set(lockKey, token, 'EX', ttlSeconds, 'NX');
            return result === 'OK' ? token : null;
        }
        catch {
            return null;
        }
    }
    async releaseLock(resource, token) {
        const lockKey = `lock:${resource}`;
        const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
        try {
            const result = await this.client.eval(luaScript, 1, lockKey, token);
            return result === 1;
        }
        catch {
            return false;
        }
    }
};
exports.RedisCacheService = RedisCacheService;
exports.RedisCacheService = RedisCacheService = RedisCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisCacheService);
//# sourceMappingURL=redis.service.js.map