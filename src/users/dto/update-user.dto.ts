import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

import { Role } from "../../common/enums/role.enum";
import { UserStatus } from "../../common/enums/user-status.enum";
import { ROLE_VALUES, STATUS_VALUES } from "../../common/enums/role.swagger";

export class UpdateUserDto {
  @ApiPropertyOptional({ type: String, example: "Jane Cooper" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String, example: "updated@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: ROLE_VALUES, example: "editor" })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: STATUS_VALUES, example: "active" })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ type: String, example: "+1 (415) 555-0100" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: String, example: "San Francisco, US" })
  @IsOptional()
  @IsString()
  location?: string;
}
