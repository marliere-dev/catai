import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { CollectionRequest } from './collection-request.entity';

@Entity('request_images')
export class RequestImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'request_id', type: 'uuid', unique: true })
  requestId!: string;

  @OneToOne(() => CollectionRequest, (request) => request.image, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request!: CollectionRequest;

  @Exclude()
  @Column({ name: 'image_key' })
  imageKey!: string;

  @Column({ name: 'image_url' })
  imageUrl!: string;

  @Column({ name: 'content_type', length: 64 })
  contentType!: string;

  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
