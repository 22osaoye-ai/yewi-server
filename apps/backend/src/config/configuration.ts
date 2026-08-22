export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  appName: process.env.APP_NAME ?? 'Yewi Marketplace API',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '7d',
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  },

  business: {
    platformCommission: parseFloat(
      process.env.PLATFORM_COMMISSION_PERCENTAGE ?? '15',
    ),
    maxProsPerLead: parseInt(process.env.MAX_PROS_PER_LEAD ?? '5', 10),
    autoCompleteDays: parseInt(process.env.AUTO_COMPLETE_ORDER_DAYS ?? '3', 10),
    defaultCreditPrice: parseFloat(
      process.env.DEFAULT_CREDIT_PRICE_EUR ?? '1.0',
    ),
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  storage: {
    driver: process.env.STORAGE_DRIVER ?? 'local',
    localPath: process.env.STORAGE_LOCAL_PATH ?? './uploads',
  },
});
