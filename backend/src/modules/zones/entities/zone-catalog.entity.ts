import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('zone_catalog')
export class ZoneCatalog extends BaseEntity {
  @Column({ name: 'codigo_zona', type: 'varchar', length: 20 })
  @Index()
  codigoZona: string;

  @Column({ name: 'nombre_zona', type: 'varchar', length: 200 })
  nombreZona: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}
