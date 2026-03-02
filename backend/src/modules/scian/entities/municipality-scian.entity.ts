import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ScianCatalog } from './scian-catalog.entity';

@Entity('municipality_scian')
@Unique(['municipalityId', 'scianId'])
export class MunicipalityScian extends BaseEntity {
  @Column({ name: 'municipality_id', type: 'uuid' })
  @Index()
  municipalityId: string;

  @Column({ name: 'scian_id', type: 'uuid' })
  @Index()
  scianId: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToOne(() => ScianCatalog)
  @JoinColumn({ name: 'scian_id' })
  scian: ScianCatalog;
}
