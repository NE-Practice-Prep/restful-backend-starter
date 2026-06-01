import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateMeDto {
  @ApiPropertyOptional({ type: String, example: "Jane Cooper" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String, example: "user@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: String, example: "Product operations lead." })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: String, example: "San Francisco, US" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ type: String, example: "+1 (415) 555-0100" })
  @IsOptional()
  @IsString()
  phone?: string;
}
