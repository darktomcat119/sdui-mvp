import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { ScianCatalog } from '../../scian/entities/scian-catalog.entity';
import { ZoneCatalog } from '../../zones/entities/zone-catalog.entity';

@Entity('taxpayers')
export class Taxpayer extends TenantBaseEntity {
  @Column({ name: 'razon_social', type: 'varchar', length: 300 })
  razonSocial: string;

  @Column({ name: 'tipo_personalidad', type: 'varchar', length: 10 })
  tipoPersonalidad: string;

  @Column({ type: 'varchar', length: 13, nullable: true })
  rfc: string | null;

  @Column({ type: 'varchar', length: 18, nullable: true })
  curp: string | null;

  @Column({ name: 'tipo_tramite', type: 'varchar', length: 15 })
  tipoTramite: string;

  @Column({ name: 'numero_licencia', type: 'varchar', length: 50, nullable: true })
  numeroLicencia: string | null;

  @Column({ name: 'clave_catastral', type: 'varchar', length: 50, nullable: true })
  claveCatastral: string | null;

  @Column({ name: 'uso_suelo', type: 'varchar', length: 100, nullable: true })
  usoSuelo: string | null;

  @Column({ name: 'actividad_regulada', type: 'text', nullable: true })
  actividadRegulada: string | null;

  @Column({ name: 'scian_id', type: 'uuid' })
  @Index()
  scianId: string;

  @Column({ name: 'zone_id', type: 'uuid' })
  @Index()
  zoneId: string;

  @Column({ name: 'tipo_contribuyente', type: 'varchar', length: 15 })
  tipoContribuyente: string;

  @Column({ name: 'superficie_m2', type: 'numeric', precision: 10, scale: 2 })
  superficieM2: number;

  @Column({ name: 'cuota_vigente', type: 'numeric', precision: 12, scale: 2 })
  cuotaVigente: number;

  @Column({ type: 'varchar', length: 15, default: 'activo' })
  @Index()
  estatus: string;

  @ManyToOne(() => ScianCatalog)
  @JoinColumn({ name: 'scian_id' })
  scian: ScianCatalog;

  @ManyToOne(() => ZoneCatalog)
  @JoinColumn({ name: 'zone_id' })
  zone: ZoneCatalog;
}
