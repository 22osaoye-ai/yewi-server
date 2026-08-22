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
exports.CreateServiceRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateServiceRequestDto {
    categoryId;
    title;
    description;
    questionnaireAnswers;
    budgetMin;
    budgetMax;
    isUrgent = false;
    preferredDate;
    postalCode;
    city;
    country = 'ES';
    address;
    latitude;
    longitude;
    isRemote = false;
}
exports.CreateServiceRequestDto = CreateServiceRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ID_DE_LA_CATEGORIA' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Necesito fontanero urgente para fuga en cocina' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Hay una fuga de agua debajo del fregadero que no para...',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            propertyType: 'Piso',
            urgency: 'Lo antes posible',
            room: 'Cocina',
        },
        description: 'Respuestas al cuestionario dinámico de la categoría',
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateServiceRequestDto.prototype, "questionnaireAnswers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 80.0,
        description: 'Presupuesto mínimo estimado',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateServiceRequestDto.prototype, "budgetMin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 250.0,
        description: 'Presupuesto máximo estimado',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateServiceRequestDto.prototype, "budgetMax", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: false,
        description: 'Indica si es un servicio urgente',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateServiceRequestDto.prototype, "isUrgent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-09-01T10:00:00.000Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "preferredDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '28001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Madrid' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'España' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Calle Gran Vía 28' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 40.4168,
        description: 'Latitud de la solicitud',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateServiceRequestDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: -3.7038,
        description: 'Longitud de la solicitud',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateServiceRequestDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: false,
        description: '¿Es un trabajo 100% online/remoto?',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateServiceRequestDto.prototype, "isRemote", void 0);
//# sourceMappingURL=create-service-request.dto.js.map