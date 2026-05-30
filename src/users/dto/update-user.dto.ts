import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";
import { IsArray, IsEnum } from "class-validator";

import { Role } from "../../common/enums/role.enum";
import { ROLE_VALUES } from "../../common/enums/role.swagger";

export class UpdateUserDto {
  @ApiPropertyOptional({ type: String, example: "updated@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: String, example: "Jane Doe", nullable: true })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ enum: ROLE_VALUES, isArray: true, example: ["USER", "MODERATOR"] })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
