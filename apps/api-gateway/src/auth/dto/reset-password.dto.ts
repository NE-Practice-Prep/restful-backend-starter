import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ type: String, example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, example: "reset-session-token" })
  @IsString()
  token!: string;

  @ApiProperty({ type: String, example: "newSecurePass123", minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
