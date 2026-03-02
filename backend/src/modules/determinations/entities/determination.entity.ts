import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Taxpayer } from '../../taxpayers/entities/taxpayer.entity';
import { WeightConfiguration } from '../../weights/entities/weight-configuration.entity';

@Entity('determinations')
export class Determination extends TenantBaseEntity {
  @Column({ name: 'taxpayer_id', type: 'uuid' })
  @Index()
  taxpayerId: string;

  @Column({ name: 'weight_config_id', type: 'uuid' })
  weightConfigId: string;

  @Column({ name: 'ejercicio_fiscal', type: 'int' })
  @Index()
  ejercicioFiscal: number;

  @Column({ name: 'v_superficie', type: 'numeric', precision: 6, scale: 4 })
  vSuperficie: number;

  @Column({ name: 'v_zona', type: 'numeric', precision: 6, scale: 4 })
  vZona: number;

  @Column({ name: 'v_giro', type: 'numeric', precision: 6, scale: 4 })
  vGiro: number;

  @Column({ name: 'v_tipo', type: 'numeric', precision: 6, scale: 4 })
  vTipo: number;

  @Column({ name: 'p_superficie', type: 'numeric', precision: 5, scale: 4 })
  pSuperficie: number;

  @Column({ name: 'p_zona', type: 'numeric', precision: 5, scale: 4 })
  pZona: number;

  @Column({ name: 'p_giro', type: 'numeric', precision: 5, scale: 4 })
  pGiro: number;

  @Column({ name: 'p_tipo', type: 'numeric', precision: 5, scale: 4 })
  pTipo: number;

  @Column({ type: 'numeric', precision: 6, scale: 4 })
  itd: number;

  @Column({ type: 'varchar', length: 15 })
  @Index()
  clasificacion: string;

  @Column({ name: 'cuota_vigente', type: 'numeric', precision: 12, scale: 2 })
  cuotaVigente: number;

  @Column({ name: 'cuota_sdui', type: 'numeric', precision: 12, scale: 2 })
  cuotaSdui: number;

  @Column({ name: 'variacion_pct', type: 'numeric', precision: 8, scale: 4 })
  variacionPct: number;

  @Column({
    name: 'limite_pct_aplicado',
    type: 'numeric',
    precision: 5,
    scale: 4,
  })
  limitePctAplicado: number;

  @Column({ type: 'varchar', length: 20, default: 'calculada' })
  @Index()
  estatus: string;

  @Column({ name: 'cuota_base_legal', type: 'numeric', precision: 12, scale: 2, nullable: true })
  cuotaBaseLegal: number | null;

  @Column({ name: 'config_version_id', type: 'uuid', nullable: true })
  configVersionId: string | null;

  @Column({ name: 'fundamento_normativo', type: 'text', nullable: true })
  fundamentoNormativo: string | null;

  @ManyToOne(() => Taxpayer)
  @JoinColumn({ name: 'taxpayer_id' })
  taxpayer: Taxpayer;

  @ManyToOne(() => WeightConfiguration)
  @JoinColumn({ name: 'weight_config_id' })
  weightConfig: WeightConfiguration;
}
