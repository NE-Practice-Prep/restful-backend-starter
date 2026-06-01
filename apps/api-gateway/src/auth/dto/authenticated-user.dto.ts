import { ApiProperty } from "@nestjs/swagger";

import { Role } from "@shared/common/enums/role.enum";
import { ROLE_VALUES } from "@shared/common/enums/role.swagger";

export class AuthenticatedUserDto {
  @ApiProperty({ type: String, example: "clxyz123abc456def789" })
  sub!: string;

  @ApiProperty({ type: String, example: "user@example.com" })
  email!: string;

  @ApiProperty({ enum: ROLE_VALUES, example: "viewer" })
  role!: Role;
}
