import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSiteDto {
  @ApiProperty({ type: String, example: "Headquarters" })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  name!: string;

  @ApiPropertyOptional({ type: String, example: "HQ-001" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @ApiPropertyOptional({ type: String, example: "123 Main St" })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  address?: string;

  @ApiPropertyOptional({ type: String, example: "San Francisco" })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  city?: string;

  @ApiPropertyOptional({ type: String, example: "CA" })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  state?: string;

  @ApiPropertyOptional({ type: String, example: "94105" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  @ApiPropertyOptional({ type: String, example: "US" })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  country?: string;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
