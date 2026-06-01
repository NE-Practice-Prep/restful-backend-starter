import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Equals, IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ type: String, example: "John Doe" })
  @IsString()
  fullName!: string;

  @ApiProperty({ type: String, example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, example: "securePass123", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ type: Boolean, example: true })
  @IsBoolean()
  @Equals(true, { message: "You must accept the terms of service" })
  acceptTerms!: boolean;
}
