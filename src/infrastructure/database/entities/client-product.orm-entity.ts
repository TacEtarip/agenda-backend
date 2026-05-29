import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientProductStatus } from '@domain/enums/client-product-status.enum';
import { ClientOrmEntity } from './client.orm-entity';
import { ProductOrmEntity } from './product.orm-entity';

@Entity('client_products')
export class ClientProductOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ClientProductStatus,
    default: ClientProductStatus.OFFERED,
  })
  status!: ClientProductStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'offered_at' })
  offeredAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Foreign Keys
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  // Relations
  @ManyToOne(
    () => ClientOrmEntity,
    (client: ClientOrmEntity) => client.clientProducts,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'client_id' })
  client!: ClientOrmEntity;

  @ManyToOne(
    () => ProductOrmEntity,
    (product: ProductOrmEntity) => product.clientProducts,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'product_id' })
  product!: ProductOrmEntity;
}
