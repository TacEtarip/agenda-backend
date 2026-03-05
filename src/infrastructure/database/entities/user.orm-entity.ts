import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ClientOrmEntity } from './client.orm-entity';
import { AppointmentOrmEntity } from './appointment.orm-entity';
import { ProductOrmEntity } from './product.orm-entity';

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash!: string;

  @Column({ name: 'google_id', unique: true, nullable: true })
  googleId!: string;

  @Column({ name: 'microsoft_id', unique: true, nullable: true })
  microsoftId!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @OneToMany(() => ClientOrmEntity, (client) => client.user)
  clients!: ClientOrmEntity[];

  @OneToMany(() => AppointmentOrmEntity, (appointment) => appointment.user)
  appointments!: AppointmentOrmEntity[];

  @OneToMany(() => ProductOrmEntity, (product) => product.user)
  products!: ProductOrmEntity[];
}
