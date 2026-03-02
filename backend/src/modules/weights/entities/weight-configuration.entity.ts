import { Entity, Column, Unique, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';

@Entity('weight_configurations')
@Unique(['municipalityId', 'ejercicioFiscal'])
export class WeightConfiguration extends TenantBaseEntity {
  @Column({ name: 'p_superficie', type: 'numeric', precision: 5, scale: 4 })
  pSuperficie: number;

  @Column({ name: 'p_zona', type: 'numeric', precision: 5, scale: 4 })
  pZona: number;

  @Column({ name: 'p_giro', type: 'numeric', precision: 5, scale: 4 })
  pGiro: number;

  @Column({ name: 'p_tipo', type: 'numeric', precision: 5, scale: 4 })
  pTipo: number;

  @Column({
    name: 'limite_variacion_pct',
    type: 'numeric',
    precision: 5,
    scale: 4,
  })
  limiteVariacionPct: number;

  @Column({ name: 'ejercicio_fiscal', type: 'int' })
  @Index()
  ejercicioFiscal: number;

  @Column({ name: 'vigencia_desde', type: 'date' })
  vigenciaDesde: Date;

  @Column({ name: 'vigencia_hasta', type: 'date', nullable: true })
  vigenciaHasta: Date | null;

  @Column({ type: 'text', nullable: true })
  justificacion: string | null;

  @Column({ name: 'folio_acta', type: 'varchar', length: 50, nullable: true })
  folioActa: string | null;
}
