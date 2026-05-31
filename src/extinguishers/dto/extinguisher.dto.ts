import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateExtinguisherDto {
  @ApiProperty({ type: String, example: "FE-2024-001" })
  @IsString()
  serialNumber!: string;

  @ApiProperty({ type: String, example: "ABC Dry Chemical" })
  @IsString()
  type!: string;

  @ApiProperty({ type: String, example: "2022-01-15" })
  @IsDateString()
  manufactureDate!: string;

  @ApiProperty({ type: String, example: "2027-01-15" })
  @IsDateString()
  expiryDate!: string;
}

export class UpdateExtinguisherDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  manufactureDate?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class AssignExtinguisherDto {
  @ApiProperty({ type: String })
  @IsString()
  customerId!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReplaceExtinguisherDto {
  @ApiProperty({ type: String, description: "New extinguisher serial to assign" })
  @IsString()
  newExtinguisherId!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}
