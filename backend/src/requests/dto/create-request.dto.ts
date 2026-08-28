import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { MaterialType, QuantityEstimate } from '../request.types';

export class CreateRequestDto {
  @IsEnum(MaterialType)
  materialType!: MaterialType;

  @IsEnum(QuantityEstimate)
  quantityEstimate!: QuantityEstimate;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsString()
  @Length(0, 280)
  locationReference?: string;
}
