import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from './redis.service';

@Global()
@Module({
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class CacheModule {}
