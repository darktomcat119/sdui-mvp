import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'municipality_id', type: 'uuid', nullable: true })
  @Index()
  municipalityId: string | null;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'user_name', type: 'varchar', length: 200 })
  userName: string;

  @Column({ name: 'user_role', type: 'varchar', length: 30 })
  userRole: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  @Index()
  timestamp: Date;

  @Column({ name: 'source_ip', type: 'inet', nullable: true })
  sourceIp: string | null;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  action: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  module: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ name: 'data_before', type: 'jsonb', nullable: true })
  dataBefore: Record<string, any> | null;

  @Column({ name: 'data_after', type: 'jsonb', nullable: true })
  dataAfter: Record<string, any> | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
