import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('redis.url') || process.env.REDIS_URL;
    const host = this.configService.get<string>('redis.host') ?? 'localhost';
    const port = this.configService.get<number>('redis.port') ?? 6379;
    const password = this.configService.get<string>('redis.password');

    const retryStrategy = (times: number) => {
      if (times > 5) {
        // Detener intentos continuos si Redis no está aprovisionado
        return null;
      }
      return Math.min(times * 200, 2000);
    };

    if (redisUrl && redisUrl.trim() !== '') {
      this.client = new Redis(redisUrl, {
        retryStrategy,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
      });
      this.logger.log(`Iniciando conexión a Redis mediante REDIS_URL`);
    } else {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        retryStrategy,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
      });
    }

    this.client.on('connect', () => {
      this.logger.log(
        redisUrl
          ? 'Conexión establecida con éxito a Redis remoto'
          : `Conexión establecida con Redis en ${host}:${port}`,
      );
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

  getClient(): Redis {
    return this.client;
  }

  /**
   * Obtener valor deserializado de la caché
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Guardar valor serializado en la caché con TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch {
      this.logger.warn(`Error al escribir en caché key ${key}`);
    }
  }

  /**
   * Eliminar clave de la caché
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      this.logger.warn(`Error al eliminar caché key ${key}`);
    }
  }

  /**
   * Eliminar claves por patrón (ej. "categories:*")
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      this.logger.warn(`Error al limpiar patrón de caché ${pattern}`);
    }
  }

  /**
   * Adquirir un bloqueo distribuido (Distributed Lock) para prevenir condiciones de carrera
   */
  async acquireLock(
    resource: string,
    ttlSeconds: number = 10,
  ): Promise<string | null> {
    const token = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const lockKey = `lock:${resource}`;

    try {
      const result = await this.client.set(
        lockKey,
        token,
        'EX',
        ttlSeconds,
        'NX',
      );
      return result === 'OK' ? token : null;
    } catch {
      return null;
    }
  }

  /**
   * Liberar un bloqueo distribuido de forma atómica usando script Lua
   */
  async releaseLock(resource: string, token: string): Promise<boolean> {
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
    } catch {
      return false;
    }
  }
}
