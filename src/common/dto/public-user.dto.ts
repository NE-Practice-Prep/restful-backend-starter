import { ApiProperty } from "@nestjs/swagger";

import { Role } from "../enums/role.enum";
import { ROLE_VALUES } from "../enums/role.swagger";

export class PublicUserDto {
  @ApiProperty({ type: String, example: "clxyz123abc456def789" })
  id!: string;

  @ApiProperty({ type: String, example: "user@example.com" })
  email!: string;

  @ApiProperty({ type: String, example: "Jane Doe", nullable: true })
  name!: string | null;

  @ApiProperty({ enum: ROLE_VALUES, isArray: true, example: ["USER"] })
  roles!: Role[];

  @ApiProperty({ type: Boolean, example: true })
  isActive!: boolean;

  @ApiProperty({ type: String, example: "2026-01-15T10:30:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ type: String, example: "2026-01-15T10:30:00.000Z" })
  updatedAt!: Date;
}
