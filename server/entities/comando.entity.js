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
let Comando = class Comando extends BaseEntity {
    constructor() {
        super(...arguments);
        this.roles = ['user'];
        this.classe = '';
        this.data_admissao_gost = '';
        this.patent = 'comando';
    }
};
__decorate([
    Property({ type: 'text', unique: true, nullable: true }),
    __metadata("design:type", Object)
], Comando.prototype, "googleId", void 0);
__decorate([
    Property({ type: 'text', unique: true }),
    __metadata("design:type", String)
], Comando.prototype, "email", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Comando.prototype, "name", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Comando.prototype, "picture", void 0);
__decorate([
    Property({ type: 'json', default: '["user"]' }),
    __metadata("design:type", Array)
], Comando.prototype, "roles", void 0);
__decorate([
    Property({ type: 'Date', nullable: true }),
    __metadata("design:type", Date)
], Comando.prototype, "lastLogin", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Comando.prototype, "password", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Comando.prototype, "classe", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Comando.prototype, "data_admissao_gost", void 0);
__decorate([
    Property({ type: 'text', nullable: true, default: 'comando' }),
    __metadata("design:type", String)
], Comando.prototype, "patent", void 0);
Comando = __decorate([
    Entity({ tableName: 'comando', schema: process.env.DB_SCHEMA || 'public' })
], Comando);
export { Comando };
