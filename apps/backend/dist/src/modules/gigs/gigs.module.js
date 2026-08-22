"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GigsModule = void 0;
const common_1 = require("@nestjs/common");
const gigs_controller_1 = require("./gigs.controller");
const gigs_service_1 = require("./gigs.service");
let GigsModule = class GigsModule {
};
exports.GigsModule = GigsModule;
exports.GigsModule = GigsModule = __decorate([
    (0, common_1.Module)({
        controllers: [gigs_controller_1.GigsController],
        providers: [gigs_service_1.GigsService],
        exports: [gigs_service_1.GigsService],
    })
], GigsModule);
//# sourceMappingURL=gigs.module.js.map