import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ type: String, example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, example: "1234", minLength: 4, maxLength: 4 })
  @IsString()
  @Length(4, 4)
  code!: string;

  @ApiProperty({ type: String, example: "newSecurePass456", minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
