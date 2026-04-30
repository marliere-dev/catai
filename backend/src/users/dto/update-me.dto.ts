import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

import { UserRole } from '../user.entity';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
