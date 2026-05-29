import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ClientOrmEntity } from './client.orm-entity';
import { CompanyOrmEntity } from './company.orm-entity';
import { AttachmentOrmEntity } from './attachment.orm-entity';

@Entity('notes')
export class NoteOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', nullable: true })
  companyId!: string;

  @ManyToOne(
    () => CompanyOrmEntity,
    (company: CompanyOrmEntity) => company.notes,
  )
  @JoinColumn({ name: 'company_id' })
  company!: CompanyOrmEntity;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Foreign Key
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  // Relations
  @ManyToOne(() => ClientOrmEntity, (client) => client.notes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client!: ClientOrmEntity;

  @OneToMany(() => AttachmentOrmEntity, (attachment) => attachment.note)
  attachments!: AttachmentOrmEntity[];
}
