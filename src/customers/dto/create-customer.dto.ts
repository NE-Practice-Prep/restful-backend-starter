import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateCustomerDto {
  @ApiProperty({ type: String, example: "Acme Corp" })
  @IsString()
  name!: string;

  @ApiProperty({ type: String, example: "contact@acme.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ type: String, example: "+1 (415) 555-0100" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: String, example: "123 Main St, City" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  contactNotes?: string;

  @ApiPropertyOptional({
    type: String,
    description: "Optional login password for customer portal access",
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  contactNotes?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
