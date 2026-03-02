import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('central_config_versions')
export class CentralConfigVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ name: 'p_superficie_min', type: 'numeric', precision: 5, scale: 4 })
  pSuperficieMin: number;

  @Column({ name: 'p_superficie_max', type: 'numeric', precision: 5, scale: 4 })
  pSuperficieMax: number;

  @Column({ name: 'p_zona_min', type: 'numeric', precision: 5, scale: 4 })
  pZonaMin: number;

  @Column({ name: 'p_zona_max', type: 'numeric', precision: 5, scale: 4 })
  pZonaMax: number;

  @Column({ name: 'p_giro_min', type: 'numeric', precision: 5, scale: 4 })
  pGiroMin: number;

  @Column({ name: 'p_giro_max', type: 'numeric', precision: 5, scale: 4 })
  pGiroMax: number;

  @Column({ name: 'p_tipo_min', type: 'numeric', precision: 5, scale: 4 })
  pTipoMin: number;

  @Column({ name: 'p_tipo_max', type: 'numeric', precision: 5, scale: 4 })
  pTipoMax: number;

  @Column({ name: 'zona_mult_min', type: 'numeric', precision: 5, scale: 2 })
  zonaMultMin: number;

  @Column({ name: 'zona_mult_max', type: 'numeric', precision: 5, scale: 2 })
  zonaMultMax: number;

  @Column({ name: 'variacion_limit_min', type: 'numeric', precision: 5, scale: 4 })
  variacionLimitMin: number;

  @Column({ name: 'variacion_limit_max', type: 'numeric', precision: 5, scale: 4 })
  variacionLimitMax: number;

  @Column({ name: 'itd_threshold_protegido', type: 'numeric', precision: 5, scale: 4, default: 0.33 })
  itdThresholdProtegido: number;

  @Column({ name: 'itd_threshold_proporcional', type: 'numeric', precision: 5, scale: 4, default: 0.66 })
  itdThresholdProporcional: number;

  @Column({ type: 'boolean', default: false })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  justification: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
