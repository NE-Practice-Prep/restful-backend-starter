import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

import { Role } from "../../common/enums/role.enum";

import { IsEnum } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

