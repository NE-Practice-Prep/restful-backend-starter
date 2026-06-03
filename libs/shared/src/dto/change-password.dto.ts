import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

import { IsStrongPassword } from "../common/validators/is-strong-password.decorator";

export class ChangePasswordDto {
  @ApiProperty({ type: String, example: "CurrentPass1!" })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ type: String, example: "NewSecurePass1!" })
  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}
