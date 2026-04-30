import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { RequestImage } from './request-image.entity';
import { MaterialType, QuantityEstimate, RequestStatus } from './request.types';

@Entity('collection_requests')
@Index(['status'])
@Index(['createdByUserId'])
@Index(['reservedByUserId'])
@Index(['status', 'latitude', 'longitude'])
export class CollectionRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Exclude()
  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId!: string;

  @Exclude()
  @Column({ name: 'reserved_by_user_id', type: 'uuid', nullable: true })
  reservedByUserId!: string | null;

  @Column({ name: 'material_type', type: 'enum', enum: MaterialType })
  materialType!: MaterialType;

  @Column({ name: 'quantity_estimate', type: 'enum', enum: QuantityEstimate })
  quantityEstimate!: QuantityEstimate;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ name: 'location_reference', type: 'text', nullable: true })
  locationReference!: string | null;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.OPEN })
  status!: RequestStatus;

  @Column({ name: 'reserved_until', type: 'timestamptz', nullable: true })
  reservedUntil!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'expired_at', type: 'timestamptz', nullable: true })
  expiredAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => RequestImage, (image) => image.request, { nullable: true })
  image?: RequestImage | null;

  distanceKm?: number;
}
