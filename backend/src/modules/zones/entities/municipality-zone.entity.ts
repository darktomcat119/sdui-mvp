import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ZoneCatalog } from './zone-catalog.entity';

@Entity('municipality_zones')
@Unique(['municipalityId', 'zoneId', 'vigenciaDesde'])
export class MunicipalityZone extends BaseEntity {
  @Column({ name: 'municipality_id', type: 'uuid' })
  @Index()
  municipalityId: string;

  @Column({ name: 'zone_id', type: 'uuid' })
  @Index()
  zoneId: string;

  @Column({ name: 'nivel_demanda', type: 'varchar', length: 5 })
  nivelDemanda: string;

  @Column({ type: 'numeric', precision: 4, scale: 2 })
  multiplicador: number;

  @Column({ name: 'vigencia_desde', type: 'date' })
  vigenciaDesde: Date;

  @Column({ name: 'vigencia_hasta', type: 'date', nullable: true })
  vigenciaHasta: Date | null;

  @Column({ type: 'text', nullable: true })
  justificacion: string | null;

  @ManyToOne(() => ZoneCatalog)
  @JoinColumn({ name: 'zone_id' })
  zone: ZoneCatalog;
}
