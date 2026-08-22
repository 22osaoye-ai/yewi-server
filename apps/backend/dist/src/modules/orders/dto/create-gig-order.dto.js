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
exports.OpenDisputeDto = exports.RequestRevisionDto = exports.SubmitDeliveryDto = exports.SubmitRequirementsDto = exports.CreateGigOrderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateGigOrderDto {
    gigPackageId;
    extraIds;
    requirementsAnswers;
}
exports.CreateGigOrderDto = CreateGigOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'ID_DEL_GIG_PACKAGE',
        description: 'ID del paquete seleccionado (Básico, Estándar o Premium)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGigOrderDto.prototype, "gigPackageId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['ID_EXTRA_1', 'ID_EXTRA_2'],
        description: 'IDs de extras opcionales añadidos',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateGigOrderDto.prototype, "extraIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: {
            brandName: 'TechNova',
            preferredColors: 'Azul y Plata',
            targetAudience: 'Startups y desarrolladores',
        },
        description: 'Respuestas a los requerimientos solicitados por el freelancer',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateGigOrderDto.prototype, "requirementsAnswers", void 0);
class SubmitRequirementsDto {
    requirementsAnswers;
}
exports.SubmitRequirementsDto = SubmitRequirementsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            brandName: 'TechNova',
            notes: 'Queremos un diseño minimalista.',
        },
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitRequirementsDto.prototype, "requirementsAnswers", void 0);
class SubmitDeliveryDto {
    message;
    attachmentUrls;
}
exports.SubmitDeliveryDto = SubmitDeliveryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Hola! Aquí tienes la entrega final con los logotipos en todos los formatos vectoriales solicitados.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmitDeliveryDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['https://storage.yewi.com/deliveries/logo_final.zip'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SubmitDeliveryDto.prototype, "attachmentUrls", void 0);
class RequestRevisionDto {
    revisionNotes;
}
exports.RequestRevisionDto = RequestRevisionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Por favor, ¿podrías ajustar el tono de azul para que sea un poco más oscuro y probar una variante con tipografía serif?',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestRevisionDto.prototype, "revisionNotes", void 0);
class OpenDisputeDto {
    reason;
    description;
    evidenceUrls;
}
exports.OpenDisputeDto = OpenDisputeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'El trabajo entregado no coincide con lo acordado' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OpenDisputeDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'El freelancer no respondió a los requerimientos y entregó una plantilla genérica.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OpenDisputeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['https://storage.yewi.com/disputes/prueba1.png'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], OpenDisputeDto.prototype, "evidenceUrls", void 0);
//# sourceMappingURL=create-gig-order.dto.js.map