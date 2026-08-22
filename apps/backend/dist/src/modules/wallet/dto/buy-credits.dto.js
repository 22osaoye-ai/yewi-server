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
exports.RequestPayoutDto = exports.ConfirmCreditPaymentDto = exports.CreateCreditPaymentIntentDto = exports.BuyCreditsDto = exports.CreditPack = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var CreditPack;
(function (CreditPack) {
    CreditPack["STARTER"] = "STARTER";
    CreditPack["PROFESSIONAL"] = "PROFESSIONAL";
    CreditPack["BUSINESS"] = "BUSINESS";
    CreditPack["ENTERPRISE"] = "ENTERPRISE";
})(CreditPack || (exports.CreditPack = CreditPack = {}));
class BuyCreditsDto {
    pack;
    paymentMethodId;
}
exports.BuyCreditsDto = BuyCreditsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: CreditPack, example: CreditPack.PROFESSIONAL }),
    (0, class_validator_1.IsEnum)(CreditPack),
    __metadata("design:type", String)
], BuyCreditsDto.prototype, "pack", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'pm_card_visa',
        description: 'Token de método de pago o pasarela',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BuyCreditsDto.prototype, "paymentMethodId", void 0);
class CreateCreditPaymentIntentDto {
    pack;
}
exports.CreateCreditPaymentIntentDto = CreateCreditPaymentIntentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: CreditPack, example: CreditPack.PROFESSIONAL }),
    (0, class_validator_1.IsEnum)(CreditPack),
    __metadata("design:type", String)
], CreateCreditPaymentIntentDto.prototype, "pack", void 0);
class ConfirmCreditPaymentDto {
    paymentIntentId;
}
exports.ConfirmCreditPaymentDto = ConfirmCreditPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'pi_3MtwBwLkdIwHu7ix28a3tqPa',
        description: 'ID del PaymentIntent verificado por la pasarela de pagos',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConfirmCreditPaymentDto.prototype, "paymentIntentId", void 0);
class RequestPayoutDto {
    amount;
    destinationAccount;
}
exports.RequestPayoutDto = RequestPayoutDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150.0, description: 'Cantidad en euros a retirar' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.Min)(20),
    __metadata("design:type", Number)
], RequestPayoutDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'ES9121000418450200051332',
        description: 'IBAN o cuenta Stripe Connect',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestPayoutDto.prototype, "destinationAccount", void 0);
//# sourceMappingURL=buy-credits.dto.js.map