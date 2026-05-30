import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { IsEnum } from "class-validator";

import { Role } from "../../common/enums/role.enum";
import { ROLE_VALUES } from "../../common/enums/role.swagger";

export class CreateUserDto {
  @ApiProperty({ type: String, example: "newuser@example.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ type: String, example: "Jane Doe" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ type: String, example: "securePass123", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: ROLE_VALUES, isArray: true, example: ["USER"] })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ApiPropertyOptional({ type: Boolean, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
