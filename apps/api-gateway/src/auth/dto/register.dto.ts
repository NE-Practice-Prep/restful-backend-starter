import { ApiProperty } from "@nestjs/swagger";
import { Equals, IsBoolean, IsEmail, IsString } from "class-validator";

import { IsStrongPassword } from "@shared/common/validators/is-strong-password.decorator";

export class RegisterDto {
  @ApiProperty({ type: String, example: "John Doe" })
  @IsString()
  fullName!: string;

  @ApiProperty({ type: String, example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({
    type: String,
    example: "SecurePass1!",
    description:
      "At least 8 characters with uppercase, lowercase, number, and special character",
  })
  @IsString()
  @IsStrongPassword()
  password!: string;

  @ApiProperty({ type: Boolean, example: true })
  @IsBoolean()
  @Equals(true, { message: "You must accept the terms of service" })
  acceptTerms!: boolean;
}
