import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

import {
  ExtinguisherStatus,
  MaintenanceType,
} from "@shared/generated/prisma/enums";

export class UpdateMaintenanceDto {
  @ApiPropertyOptional({ enum: MaintenanceType })
  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  conditionsNoted?: string;

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
