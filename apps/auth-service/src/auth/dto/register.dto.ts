import { ApiProperty } from "@nestjs/swagger";
import { Equals, IsBoolean, IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "John" })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: "user@company.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true, { message: "You must accept the terms of service" })
  acceptTerms!: boolean;
}
