import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ type: String, example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ type: String, example: "Jane Doe" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ type: String, example: "securePass123", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
