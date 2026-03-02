import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('scian_catalog')
export class ScianCatalog extends BaseEntity {
  @Column({ name: 'codigo_scian', type: 'varchar', length: 4, unique: true })
  @Index()
  codigoScian: string;

  @Column({ name: 'descripcion_scian', type: 'varchar', length: 500 })
  descripcionScian: string;

  @Column({ name: 'impacto_sdui', type: 'varchar', length: 5 })
  impactoSdui: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}
