import { ApiProperty } from "@nestjs/swagger";

import { Role } from "../../common/enums/role.enum";
import { ROLE_VALUES } from "../../common/enums/role.swagger";

export class AuthenticatedUserDto {
  @ApiProperty({
    type: String,
    example: "clxyz123abc456def789",
    description: "User ID from JWT subject claim",
  })
  sub!: string;

  @ApiProperty({ type: String, example: "user@example.com" })
  email!: string;

  @ApiProperty({ enum: ROLE_VALUES, isArray: true, example: ["USER"] })
  roles!: Role[];
}
