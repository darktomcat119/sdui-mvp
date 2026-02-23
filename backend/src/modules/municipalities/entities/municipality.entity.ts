import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('municipalities')
export class Municipality {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ name: 'official_name', type: 'varchar', length: 300, nullable: true })
  officialName: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  @Index()
  status: 'active' | 'inactive' | 'suspended';

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, any>;

  @Column({ type: 'varchar', length: 50, default: 'America/Mexico_City' })
  timezone: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
