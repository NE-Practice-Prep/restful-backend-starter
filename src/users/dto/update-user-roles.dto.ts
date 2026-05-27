import { IsArray, IsEnum } from "class-validator";

import { Role } from "../../common/enums/role.enum";

export class UpdateUserRolesDto {
  @IsArray()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}

