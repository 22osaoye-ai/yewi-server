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
exports.CreateQuoteProposalDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateQuoteProposalDto {
    price;
    estimatedDays;
    message;
    breakdown;
    expiresAt;
}
exports.CreateQuoteProposalDto = CreateQuoteProposalDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 120.0,
        description: 'Precio total del presupuesto propuesto',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateQuoteProposalDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 2,
        description: 'Días estimados para completar el trabajo',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateQuoteProposalDto.prototype, "estimatedDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Hola! Puedo pasarme mañana mismo a revisar y reparar la fuga. Incluyo materiales y garantía de 6 meses.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuoteProposalDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: {
            labor: 80.0,
            materials: 40.0,
            warrantyMonths: 6,
        },
        description: 'Desglose detallado del presupuesto',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateQuoteProposalDto.prototype, "breakdown", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-09-01T23:59:59.000Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateQuoteProposalDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=create-quote-proposal.dto.js.map