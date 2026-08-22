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
exports.CreatePaymentIntentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePaymentIntentDto {
    amount;
    currency = 'EUR';
    paymentType;
    referenceId;
}
exports.CreatePaymentIntentDto = CreatePaymentIntentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 49.99, description: 'Monto a cobrar en EUR' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreatePaymentIntentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EUR' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentIntentDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'GIG_PURCHASE',
        description: 'Tipo de compra',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentIntentDto.prototype, "paymentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ID_DEL_PAQUETE_O_SOLICITUD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentIntentDto.prototype, "referenceId", void 0);
//# sourceMappingURL=create-payment-intent.dto.js.map