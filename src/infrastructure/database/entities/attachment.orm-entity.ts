import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClientOrmEntity } from './client.orm-entity';
import { NoteOrmEntity } from './note.orm-entity';

@Entity('attachments')
export class AttachmentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'file_name' })
  fileName!: string;

  @Column({ name: 'file_type', nullable: true })
  fileType!: string;

  @Column({ name: 'file_url' })
  fileUrl!: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt!: Date;

  // Foreign Keys
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'note_id', type: 'uuid', nullable: true })
  noteId!: string;

  // Relations
  @ManyToOne(() => ClientOrmEntity, (client) => client.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client!: ClientOrmEntity;

  @ManyToOne(() => NoteOrmEntity, (note) => note.attachments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'note_id' })
  note!: NoteOrmEntity;
}
