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
exports.ReplyReviewDto = exports.CreateReviewDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateReviewDto {
    orderId;
    rating;
    qualityRating;
    communicationRating;
    deliveryRating;
    comment;
}
exports.CreateReviewDto = CreateReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ID_DEL_PEDIDO_COMPLETADO' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 5,
        minimum: 1,
        maximum: 5,
        description: 'Calificación general (1 a 5)',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 5,
        minimum: 1,
        maximum: 5,
        description: 'Calidad del trabajo',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "qualityRating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 5,
        minimum: 1,
        maximum: 5,
        description: 'Comunicación y claridad',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "communicationRating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 5,
        minimum: 1,
        maximum: 5,
        description: 'Puntualidad en la entrega',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "deliveryRating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '¡Excelente profesional! Entregó el trabajo antes de tiempo y con una calidad insuperable. Totalmente recomendado.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "comment", void 0);
class ReplyReviewDto {
    reply;
}
exports.ReplyReviewDto = ReplyReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '¡Muchas gracias por confiar en mi trabajo! Ha sido un placer colaborar juntos.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReplyReviewDto.prototype, "reply", void 0);
//# sourceMappingURL=create-review.dto.js.map