import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { ExtinguisherSize } from "@shared/common/enums/extinguisher-size.enum";
import { ExtinguisherType } from "@shared/common/enums/extinguisher-type.enum";
import { ExtinguisherStatus } from "@shared/generated/prisma/enums";

export class RegisterExtinguisherDto {
  @ApiProperty({ type: String, example: "FE-2024-00142" })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  serialNumber!: string;

  @ApiProperty({ type: String, example: "Building A — 2nd floor, east stairwell" })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  location!: string;

  @ApiProperty({ enum: ExtinguisherType })
  @IsEnum(ExtinguisherType)
  type!: ExtinguisherType;

  @ApiProperty({ enum: ExtinguisherSize })
  @IsEnum(ExtinguisherSize)
  size!: ExtinguisherSize;

  @ApiProperty({ type: String, format: "date-time" })
  @Type(() => Date)
  @IsDate()
  installedAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  @Type(() => Date)
  @IsDate()
  expiresAt!: Date;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  siteId?: string;

  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatus;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
