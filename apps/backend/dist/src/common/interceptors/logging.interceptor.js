"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = class LoggingInterceptor {
    logger = new common_1.Logger('HTTP');
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const method = req.method;
        const url = req.originalUrl || req.url;
        const ip = req.ip || req.socket.remoteAddress;
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const duration = Date.now() - startTime;
                const statusCode = res.statusCode;
                this.logger.log(`[${method}] ${url} ${statusCode} - ${duration}ms [${ip}]`);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                const statusCode = err &&
                    typeof err === 'object' &&
                    'status' in err &&
                    typeof err.status === 'number'
                    ? err.status
                    : 500;
                const message = err instanceof Error ? err.message : 'Error interno';
                this.logger.warn(`[${method}] ${url} ${statusCode} - ${duration}ms [${ip}] - ${message}`);
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map