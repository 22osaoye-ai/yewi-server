import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  API_PREFIX: Joi.string().default('api/v1'),
  APP_NAME: Joi.string().default('Yewi Marketplace API'),

  DATABASE_URL: Joi.string().required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  CORS_ORIGIN: Joi.string().default('*'),

  PLATFORM_COMMISSION_PERCENTAGE: Joi.number().min(0).max(100).default(15),
  MAX_PROS_PER_LEAD: Joi.number().default(5),
  AUTO_COMPLETE_ORDER_DAYS: Joi.number().default(3),
  DEFAULT_CREDIT_PRICE_EUR: Joi.number().default(1.0),

  STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').optional(),

  STORAGE_DRIVER: Joi.string().valid('local', 's3').default('local'),
  STORAGE_LOCAL_PATH: Joi.string().default('./uploads'),
});
