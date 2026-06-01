import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { Role } from "../enums/role.enum";
import { UserStatus } from "../enums/user-status.enum";
import { ROLE_VALUES, STATUS_VALUES } from "../enums/role.swagger";

export class PublicUserDto {
  @ApiProperty({ type: String, example: "clxyz123abc456def789" })
  id!: string;

  @ApiProperty({ type: String, example: "Jane Cooper" })
  name!: string;

  @ApiProperty({ type: String, example: "user@example.com" })
  email!: string;

  @ApiProperty({ enum: ROLE_VALUES, example: "viewer" })
  role!: Role;

  @ApiProperty({ enum: STATUS_VALUES, example: "active" })
  status!: UserStatus;

  @ApiPropertyOptional({ type: String, example: "+1 (415) 555-0100" })
  phone?: string;

  @ApiPropertyOptional({ type: String, example: "San Francisco, US" })
  location?: string;

  @ApiProperty({ type: String, example: "2026-01-15T10:30:00.000Z" })
  createdAt!: string;
}

export class CurrentUserResponseDto {
  @ApiProperty({ type: String, example: "Jane Cooper" })
  name!: string;

  @ApiProperty({ type: String, example: "user@example.com" })
  email!: string;

  @ApiProperty({ type: String, example: "/avatars/default.jpg" })
  avatar!: string;

  @ApiProperty({ type: String, example: "Administrator" })
  role!: string;

  @ApiProperty({ type: String, example: "Product operations lead." })
  bio!: string;

  @ApiProperty({ type: String, example: "San Francisco, US" })
  location!: string;

  @ApiProperty({ type: String, example: "+1 (415) 555-0100" })
  phone!: string;
}
