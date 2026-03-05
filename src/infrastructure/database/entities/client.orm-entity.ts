import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { NoteOrmEntity } from './note.orm-entity';
import { AppointmentOrmEntity } from './appointment.orm-entity';
import { AttachmentOrmEntity } from './attachment.orm-entity';
import { ClientProductOrmEntity } from './client-product.orm-entity';

import { ClientStage } from '@domain/enums/client-stage.enum';

@Entity('clients')
export class ClientOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ name: 'phone_number' })
  phoneNumber!: string;

  @Column({
    type: 'enum',
    enum: ClientStage,
    default: ClientStage.FIRST_CONTACT,
  })
  stage!: ClientStage;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Foreign Key
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  // Relations
  @ManyToOne(() => UserOrmEntity, (user) => user.clients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;

  @OneToMany(() => NoteOrmEntity, (note) => note.client)
  notes!: NoteOrmEntity[];

  @OneToMany(() => AppointmentOrmEntity, (appointment) => appointment.client)
  appointments!: AppointmentOrmEntity[];

  @OneToMany(() => AttachmentOrmEntity, (attachment) => attachment.client)
  attachments!: AttachmentOrmEntity[];

  @OneToMany(
    () => ClientProductOrmEntity,
    (clientProduct) => clientProduct.client,
  )
  clientProducts!: ClientProductOrmEntity[];
}
