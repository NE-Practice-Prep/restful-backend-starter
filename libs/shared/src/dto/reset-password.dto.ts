import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

import { IsStrongPassword } from "../common/validators/is-strong-password.decorator";

export class ResetPasswordDto {
  @ApiProperty({ type: String, example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, example: "1234", minLength: 4, maxLength: 4 })
  @IsString()
  @Length(4, 4)
  code!: string;

  @ApiProperty({ type: String, example: "NewSecurePass1!" })
  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}
