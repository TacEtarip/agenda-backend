import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { ClientOrmEntity } from './client.orm-entity';
import { AppointmentOrmEntity } from './appointment.orm-entity';
import { ProductOrmEntity } from './product.orm-entity';
import { NoteOrmEntity } from './note.orm-entity';
import { MessageTemplateOrmEntity } from './message-template.orm-entity';
import { AttachmentOrmEntity } from './attachment.orm-entity';

@Entity('companies')
export class CompanyOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ name: 'yape_enabled', default: false })
  yapeEnabled!: boolean;

  @Column({ name: 'yape_phone', type: 'varchar', length: 9, nullable: true })
  yapePhone!: string | null;

  @Column({
    name: 'yape_account_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  yapeAccountName!: string | null;

  @Column({ name: 'yape_qr_image_data_url', type: 'text', nullable: true })
  yapeQrImageDataUrl!: string | null;

  @Column({ name: 'culqi_enabled', default: false })
  culqiEnabled!: boolean;

  @Column({
    name: 'culqi_public_key',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  culqiPublicKey!: string | null;

  @Column({ name: 'culqi_private_key_encrypted', type: 'text', nullable: true })
  culqiPrivateKeyEncrypted!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => UserOrmEntity, (user: UserOrmEntity) => user.company)
  users!: UserOrmEntity[];

  @OneToMany(() => ClientOrmEntity, (client: ClientOrmEntity) => client.company)
  clients!: ClientOrmEntity[];

  @OneToMany(
    () => AppointmentOrmEntity,
    (appointment: AppointmentOrmEntity) => appointment.company,
  )
  appointments!: AppointmentOrmEntity[];

  @OneToMany(
    () => ProductOrmEntity,
    (product: ProductOrmEntity) => product.company,
  )
  products!: ProductOrmEntity[];

  @OneToMany(() => NoteOrmEntity, (note: NoteOrmEntity) => note.company)
  notes!: NoteOrmEntity[];

  @OneToMany(
    () => MessageTemplateOrmEntity,
    (template: MessageTemplateOrmEntity) => template.company,
  )
  messageTemplates!: MessageTemplateOrmEntity[];

  @OneToMany(
    () => AttachmentOrmEntity,
    (attachment: AttachmentOrmEntity) => attachment.company,
  )
  attachments!: AttachmentOrmEntity[];
}
