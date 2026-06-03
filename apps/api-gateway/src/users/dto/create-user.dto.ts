import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

import { Role } from "@shared/common/enums/role.enum";
import { UserStatus } from "@shared/common/enums/user-status.enum";
import { ROLE_VALUES, STATUS_VALUES } from "@shared/common/enums/role.swagger";

export class CreateUserDto {
  @ApiProperty({ type: String, example: "Jane" })
  @IsString()
  firstName!: string;

  @ApiProperty({ type: String, example: "Cooper" })
  @IsString()
  lastName!: string;

  @ApiProperty({ type: String, example: "newuser@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ROLE_VALUES, example: "user" })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({ enum: STATUS_VALUES, example: "invited" })
  @IsEnum(UserStatus)
  status!: UserStatus;

  @ApiPropertyOptional({ type: String, example: "+1 (415) 555-0100" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: String, example: "San Francisco, US" })
  @IsOptional()
  @IsString()
  location?: string;
}
