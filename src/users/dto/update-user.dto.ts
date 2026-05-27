import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

import { Role } from "../../common/enums/role.enum";
import { IsArray, IsEnum } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

