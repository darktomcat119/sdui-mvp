import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Determination } from './determination.entity';

@Entity('limit_exceptions')
export class LimitException extends TenantBaseEntity {
  @Column({ name: 'determination_id', type: 'uuid' })
  @Index()
  determinationId: string;

  @Column({ name: 'valor_propuesto', type: 'numeric', precision: 12, scale: 2 })
  valorPropuesto: number;

  @Column({ name: 'limite_pct', type: 'numeric', precision: 5, scale: 4 })
  limitePct: number;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  folio: string | null;

  @Column({ name: 'resolution_option', type: 'varchar', length: 10, nullable: true })
  resolutionOption: string | null;

  @Column({ name: 'escalated_to', type: 'uuid', nullable: true })
  escalatedTo: string | null;

  @Column({ name: 'justificacion_resolucion', type: 'text', nullable: true })
  justificacionResolucion: string | null;

  @Column({ type: 'varchar', length: 15, default: 'pendiente' })
  @Index()
  estatus: string;

  @Column({ name: 'aprobado_por', type: 'uuid', nullable: true })
  aprobadoPor: string | null;

  @Column({ name: 'fecha_resolucion', type: 'timestamptz', nullable: true })
  fechaResolucion: Date | null;

  @ManyToOne(() => Determination)
  @JoinColumn({ name: 'determination_id' })
  determination: Determination;
}
