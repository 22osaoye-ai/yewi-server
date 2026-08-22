"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.envValidationSchema = Joi.object({
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
//# sourceMappingURL=env.validation.js.map