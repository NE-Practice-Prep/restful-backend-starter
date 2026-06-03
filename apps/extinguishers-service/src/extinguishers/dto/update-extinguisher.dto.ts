import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

import {
  ExtinguisherSize,
  ExtinguisherStatus,
  ExtinguisherType,
  type ExtinguisherSize as ExtinguisherSizeType,
  type ExtinguisherStatus as ExtinguisherStatusType,
  type ExtinguisherType as ExtinguisherTypeType,
} from "@shared/generated/prisma/enums";
import {
  EXTINGUISHER_SIZE_VALUES,
  EXTINGUISHER_STATUS_VALUES,
  EXTINGUISHER_TYPE_VALUES,
} from "@shared/common/enums/extinguisher.swagger";

export class UpdateExtinguisherDto {
  @ApiPropertyOptional({ type: String, example: "FE-2024-001" })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ type: String, example: "Building B — Lobby" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: EXTINGUISHER_TYPE_VALUES })
  @IsOptional()
  @IsEnum(ExtinguisherType)
  type?: ExtinguisherTypeType;

  @ApiPropertyOptional({ enum: EXTINGUISHER_SIZE_VALUES })
  @IsOptional()
  @IsEnum(ExtinguisherSize)
  size?: ExtinguisherSizeType;

  @ApiPropertyOptional({ type: String, example: "2024-01-15" })
  @IsOptional()
  @IsDateString()
  installationDate?: string;

  @ApiPropertyOptional({ type: String, example: "2029-01-15" })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ enum: EXTINGUISHER_STATUS_VALUES })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatusType;
}
