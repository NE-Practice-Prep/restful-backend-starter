import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

import {
  ExtinguisherStatus,
  MaintenanceType,
} from "@shared/generated/prisma/enums";

export class UpdateMaintenanceDto {
  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  conditionsNoted?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  performedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextDueAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  partsReplaced?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  statusAfter?: ExtinguisherStatus;
}
