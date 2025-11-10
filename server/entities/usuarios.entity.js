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
let Usuario = class Usuario extends BaseEntity {
    constructor() {
        super(...arguments);
        this.roles = ['user'];
        this.comando_geral = [];
        this.comando_squad = null;
        this.classe = '';
        this.data_admissao_gost = '';
        this.patent = 'soldado';
        this.active = true;
        this.is_comandante_squad = false;
        this.nome_squad_subordinado = null;
        this.id_squad_subordinado = null;
        this.nome_guerra = null;
    }
};
__decorate([
    Property({ type: 'text', unique: true, nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "googleId", void 0);
__decorate([
    Property({ type: 'text', unique: true }),
    __metadata("design:type", String)
], Usuario.prototype, "email", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "name", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "picture", void 0);
__decorate([
    Property({ type: 'json', default: '["user"]' }),
    __metadata("design:type", Array)
], Usuario.prototype, "roles", void 0);
__decorate([
    Property({ type: 'Date', nullable: true }),
    __metadata("design:type", Date)
], Usuario.prototype, "lastLogin", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "password", void 0);
__decorate([
    Property({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], Usuario.prototype, "comando_geral", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "comando_squad", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "classe", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "data_admissao_gost", void 0);
__decorate([
    Property({ type: 'text', nullable: true, default: 'recruta' }),
    __metadata("design:type", String)
], Usuario.prototype, "patent", void 0);
__decorate([
    Property({ type: 'boolean', nullable: false, default: true }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "active", void 0);
__decorate([
    Property({ type: 'boolean', nullable: false, default: true }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "is_comandante_squad", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "nome_squad_subordinado", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "id_squad_subordinado", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "nome_guerra", void 0);
Usuario = __decorate([
    Entity({ tableName: 'users', schema: process.env.DB_SCHEMA || 'public' })
], Usuario);
export { Usuario };
