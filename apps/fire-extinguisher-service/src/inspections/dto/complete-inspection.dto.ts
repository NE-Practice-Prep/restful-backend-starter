import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import {
  InspectionResult,
  InspectionStatus,
} from "@shared/generated/prisma/enums";

export class CompleteInspectionDto {
  @ApiProperty({ enum: InspectionResult })
  @IsEnum(InspectionResult)
  result!: InspectionResult;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  pressureOk?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  sealIntact?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  gaugeReadable?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  accessible?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  findings?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  correctiveAction?: string;
}

export class UpdateInspectionDto {
  @ApiPropertyOptional({ enum: InspectionStatus })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  inspectorId?: string;
}
