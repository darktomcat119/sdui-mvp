import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Municipality } from '../../municipalities/entities/municipality.entity';
import { Determination } from '../../determinations/entities/determination.entity';
import { User } from '../../users/entities/user.entity';

@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'municipality_id', type: 'uuid' })
  @Index()
  municipalityId: string;

  @Column({ name: 'determination_id', type: 'uuid', nullable: true })
  @Index()
  determinationId: string | null;

  @Column({ type: 'varchar', length: 30 })
  tipo: string;

  @Column({ name: 'nombre_archivo', type: 'varchar', length: 255 })
  nombreArchivo: string;

  @Column({ name: 'ruta_archivo', type: 'varchar', length: 500 })
  rutaArchivo: string;

  @Column({ name: 'hash_sha256', type: 'varchar', length: 64 })
  @Index()
  hashSha256: string;

  @Column({ name: 'tamano_bytes', type: 'int' })
  tamanoBytes: number;

  @Column({ name: 'generado_por', type: 'uuid' })
  generadoPor: string;

  @Column({ type: 'boolean', default: false })
  firmado: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Municipality)
  @JoinColumn({ name: 'municipality_id' })
  municipality: Municipality;

  @ManyToOne(() => Determination)
  @JoinColumn({ name: 'determination_id' })
  determination: Determination;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'generado_por' })
  generador: User;
}
