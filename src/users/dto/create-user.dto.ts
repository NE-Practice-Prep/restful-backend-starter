import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

import { Role } from "../../common/enums/role.enum";
import { UserStatus } from "../../common/enums/user-status.enum";
import { ROLE_VALUES, STATUS_VALUES } from "../../common/enums/role.swagger";

export class CreateUserDto {
  @ApiProperty({ type: String, example: "Jane Cooper" })
  @IsString()
  name!: string;

  @ApiProperty({ type: String, example: "newuser@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ROLE_VALUES, example: "viewer" })
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
