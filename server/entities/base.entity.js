// src/entities/BaseEntity.ts
import { PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

export class BaseEntity {
    @PrimaryKey({ type: 'uuid' })
    id = uuidv4();

    @Property({ type: 'Date', onCreate: () => new Date() })
    createdAt = new Date();

    @Property({ type: 'Date', onUpdate: () => new Date(), onCreate: () => new Date() })
    updatedAt = new Date();
}