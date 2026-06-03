import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export enum InspectionResultDto {
  pass = "pass",
  fail = "fail",
}

export class CompleteInspectionMaintenanceDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  actionTaken!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  issuesIdentified?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CompleteInspectionDto {
  @ApiProperty({ enum: InspectionResultDto })
  @IsEnum(InspectionResultDto)
  result!: InspectionResultDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  issuesFound?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  recommendations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => CompleteInspectionMaintenanceDto)
  maintenance?: CompleteInspectionMaintenanceDto;
}
