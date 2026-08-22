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
exports.CreateGigDto = exports.CreateExtraDto = exports.CreatePackageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreatePackageDto {
    tier;
    name;
    description;
    price;
    deliveryDays;
    revisions = 1;
    features;
    isPopular = false;
}
exports.CreatePackageDto = CreatePackageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PackageTier, example: client_1.PackageTier.BASIC }),
    (0, class_validator_1.IsEnum)(client_1.PackageTier),
    __metadata("design:type", String)
], CreatePackageDto.prototype, "tier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Paquete Básico' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePackageDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Logotipo básico en alta resolución + 1 revisión' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePackageDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 49.99 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(5),
    __metadata("design:type", Number)
], CreatePackageDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, description: 'Días estimados de entrega' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePackageDto.prototype, "deliveryDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 2,
        description: 'Número de revisiones (-1 para ilimitadas)',
    }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreatePackageDto.prototype, "revisions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: {
            sourceFiles: true,
            highResolution: true,
            commercialUse: true,
            conceptsCount: 2,
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePackageDto.prototype, "features", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePackageDto.prototype, "isPopular", void 0);
class CreateExtraDto {
    title;
    description;
    price;
    additionalDeliveryDays = 0;
}
exports.CreateExtraDto = CreateExtraDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Entrega Extra Rápida (24h)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateExtraDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Recibe tu pedido completo en solo 24 horas.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExtraDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 25.0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateExtraDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: -2,
        description: 'Días a restar o sumar en el plazo de entrega',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateExtraDto.prototype, "additionalDeliveryDays", void 0);
class CreateGigDto {
    title;
    slug;
    categoryId;
    description;
    searchTags;
    coverImages;
    videoUrl;
    faqs;
    requirements;
    packages;
    extras;
}
exports.CreateGigDto = CreateGigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Diseñaré un logotipo profesional y moderno para tu marca',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGigDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'diseno-logotipo-profesional-marca-123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGigDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ID_DE_LA_CATEGORIA' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGigDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Descripción detallada de lo que incluye el servicio, proceso de trabajo...',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGigDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['diseño', 'branding', 'logo', 'vector'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateGigDto.prototype, "searchTags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['https://images.unsplash.com/gig-cover1.jpg'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateGigDto.prototype, "coverImages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://youtube.com/watch?v=12345' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGigDto.prototype, "videoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: [
            {
                question: '¿En qué formato recibiré los archivos?',
                answer: 'Se entregan en PNG, JPG, SVG y AI vectorizado.',
            },
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateGigDto.prototype, "faqs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: [
            'Nombre de la empresa',
            'Sector',
            'Colores preferidos',
            'Referencias visuales',
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateGigDto.prototype, "requirements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [CreatePackageDto],
        description: 'Mínimo 1 paquete (Básico, Estándar o Premium)',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreatePackageDto),
    __metadata("design:type", Array)
], CreateGigDto.prototype, "packages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CreateExtraDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateExtraDto),
    __metadata("design:type", Array)
], CreateGigDto.prototype, "extras", void 0);
//# sourceMappingURL=create-gig.dto.js.map