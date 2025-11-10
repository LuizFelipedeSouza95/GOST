var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/entities/BaseEntity.ts
import { PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
export class BaseEntity {
    constructor() {
        this.id = uuidv4();
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
__decorate([
    PrimaryKey({ type: 'uuid' }),
    __metadata("design:type", String)
], BaseEntity.prototype, "id", void 0);
__decorate([
    Property({ type: 'Date', onCreate: () => new Date() }),
    __metadata("design:type", Date)
], BaseEntity.prototype, "createdAt", void 0);
__decorate([
    Property({ type: 'Date', onUpdate: () => new Date(), onCreate: () => new Date() }),
    __metadata("design:type", Date)
], BaseEntity.prototype, "updatedAt", void 0);
