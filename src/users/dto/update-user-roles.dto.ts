import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum } from "class-validator";

import { Role } from "../../common/enums/role.enum";
import { ROLE_VALUES } from "../../common/enums/role.swagger";

export class UpdateUserRolesDto {
  @ApiProperty({ enum: ROLE_VALUES, isArray: true, example: ["USER", "MODERATOR"] })
  @IsArray()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}
