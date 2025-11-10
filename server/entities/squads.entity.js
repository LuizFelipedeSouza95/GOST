var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/entities/Usuario.ts
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
let Squads = class Squads extends BaseEntity {
    constructor() {
        super(...arguments);
        this.comando_geral = [];
        this.comando_squad = null;
    }
};
__decorate([
    Property({ type: 'text', unique: true, nullable: true }),
    __metadata("design:type", String)
], Squads.prototype, "nome", void 0);
__decorate([
    Property({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], Squads.prototype, "comando_geral", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Squads.prototype, "comando_squad", void 0);
Squads = __decorate([
    Entity({ tableName: 'squads', schema: process.env.DB_SCHEMA || 'public' })
], Squads);
export { Squads };
