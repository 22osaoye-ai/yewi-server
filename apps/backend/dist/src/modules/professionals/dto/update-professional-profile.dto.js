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
exports.SubmitKycDto = exports.CreatePortfolioItemDto = exports.UpdateProfessionalProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateProfessionalProfileDto {
    businessName;
    taxId;
    bio;
    hourlyRate;
    serviceRadiusKm;
    latitude;
    longitude;
    city;
    postalCode;
    country;
    address;
    skills;
    categoryIds;
}
exports.UpdateProfessionalProfileDto = UpdateProfessionalProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Reformas Rápidas Madrid SL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalProfileDto.prototype, "businessName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'B12345678' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalProfileDto.prototype, "taxId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Más de 15 años de experiencia en pintura, fontanería y electricidad.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalProfileDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 45.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateProfessionalProfileDto.prototype, "hourlyRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 50, description: 'Radio de cobertura en km' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(500),
    __metadata("design:type", Number)
], UpdateProfessionalProfileDto.prototype, "serviceRadiusKm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 40.4168 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateProfessionalProfileDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: -3.7038 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateProfessionalProfileDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Madrid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalProfileDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '28001' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalProfileDto.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'España' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalProfileDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Calle Alcalá 45' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfessionalProfileDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['Fontanería', 'Electricidad', 'Calefacción'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateProfessionalProfileDto.prototype, "skills", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'IDs de las categorías asociadas' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateProfessionalProfileDto.prototype, "categoryIds", void 0);
class CreatePortfolioItemDto {
    title;
    description;
    imageUrls;
    projectUrl;
    tags;
}
exports.CreatePortfolioItemDto = CreatePortfolioItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Reforma Integral de Cocina' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePortfolioItemDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Renovación completa de tuberías, alicatado y muebles de diseño.',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePortfolioItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: [
            'https://images.unsplash.com/kitchen1.jpg',
            'https://images.unsplash.com/kitchen2.jpg',
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePortfolioItemDto.prototype, "imageUrls", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://miportafolio.com/cocina' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePortfolioItemDto.prototype, "projectUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Cocinas', 'Reformas'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePortfolioItemDto.prototype, "tags", void 0);
class SubmitKycDto {
    documentUrl;
}
exports.SubmitKycDto = SubmitKycDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'https://storage.yewi.com/kyc/dni_pro_123.pdf',
        description: 'URL del documento de identidad / fiscal',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "documentUrl", void 0);
//# sourceMappingURL=update-professional-profile.dto.js.map