import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

import { UserRole } from '../user-role.enum';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
