import { Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class TenantBaseEntity extends BaseEntity {
  @Column({ name: 'municipality_id', type: 'uuid', nullable: true })
  @Index()
  municipalityId: string | null;
}
