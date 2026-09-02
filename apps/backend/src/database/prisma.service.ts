import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      let dbTarget = 'PostgreSQL';
      try {
        const parsed = new URL(process.env.DATABASE_URL || '');
        dbTarget = `${parsed.host}${parsed.pathname}`;
      } catch {
        dbTarget = 'PostgreSQL (remoto)';
      }
      this.logger.log(
        `Conexión establecida con éxito a PostgreSQL [${dbTarget}] con Prisma`,
      );
    } catch (error) {
      this.logger.error(
        'Error al conectar con la base de datos PostgreSQL:',
        error,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Conexión cerrada con PostgreSQL');
  }
}
