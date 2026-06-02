import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class VerifyPasswordResetOtpDto {
  @ApiProperty({ type: String, example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, example: "1234", minLength: 4, maxLength: 4 })
  @IsString()
  @Length(4, 4)
  code!: string;
}
