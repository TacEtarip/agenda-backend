import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { CompanyOrmEntity } from './company.orm-entity';
import { ClientProductOrmEntity } from './client-product.orm-entity';

@Entity('products')
export class ProductOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', nullable: true })
  companyId!: string;

  @ManyToOne(
    () => CompanyOrmEntity,
    (company: CompanyOrmEntity) => company.products,
  )
  @JoinColumn({ name: 'company_id' })
  company!: CompanyOrmEntity;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', nullable: true })
  price!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Foreign Key
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  // Relations
  @ManyToOne(() => UserOrmEntity, (user) => user.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;

  @OneToMany(
    () => ClientProductOrmEntity,
    (clientProduct) => clientProduct.product,
  )
  clientProducts!: ClientProductOrmEntity[];
}
