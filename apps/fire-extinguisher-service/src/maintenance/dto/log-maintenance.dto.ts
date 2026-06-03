import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import {
  ExtinguisherStatus,
  MaintenanceType,
} from "@shared/generated/prisma/enums";

export class LogMaintenanceDto {
  @ApiProperty({ type: String })
  @IsString()
  extinguisherId!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  inspectionId?: string;

  @ApiProperty({ enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @ApiProperty({ type: String, description: "Actions taken during maintenance" })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  description!: string;

  @ApiProperty({ type: String, description: "Conditions noted during maintenance" })
  @IsString()
  @MaxLength(4000)
  conditionsNoted!: string;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  performedAt?: Date;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextDueAt?: Date;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  partsReplaced?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  statusAfter?: ExtinguisherStatus;
}
