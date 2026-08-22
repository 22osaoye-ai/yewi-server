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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiErrorResponseDto = exports.ApiResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ApiResponseDto {
    success;
    statusCode;
    timestamp;
    data;
    meta;
}
exports.ApiResponseDto = ApiResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], ApiResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 200 }),
    __metadata("design:type", Number)
], ApiResponseDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-21T20:30:00.000Z' }),
    __metadata("design:type", String)
], ApiResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Datos devueltos por la API' }),
    __metadata("design:type", Object)
], ApiResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Metadatos adicionales o de paginación',
    }),
    __metadata("design:type", Object)
], ApiResponseDto.prototype, "meta", void 0);
class ApiErrorResponseDto {
    success;
    statusCode;
    timestamp;
    path;
    error;
    message;
    details;
}
exports.ApiErrorResponseDto = ApiErrorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], ApiErrorResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 400 }),
    __metadata("design:type", Number)
], ApiErrorResponseDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-21T20:30:00.000Z' }),
    __metadata("design:type", String)
], ApiErrorResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '/api/v1/auth/login' }),
    __metadata("design:type", String)
], ApiErrorResponseDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bad Request' }),
    __metadata("design:type", String)
], ApiErrorResponseDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Credenciales inválidas' }),
    __metadata("design:type", Object)
], ApiErrorResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Object)
], ApiErrorResponseDto.prototype, "details", void 0);
//# sourceMappingURL=api-response.dto.js.map