import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

import { ExtinguisherSize } from "@shared/common/enums/extinguisher-size.enum";
import { ExtinguisherType } from "@shared/common/enums/extinguisher-type.enum";
import { ExtinguisherStatus } from "@shared/generated/prisma/enums";

export class UpdateExtinguisherDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  location?: string;

  @ApiPropertyOptional({ enum: ExtinguisherType })
  @IsOptional()
  @IsEnum(ExtinguisherType)
  type?: ExtinguisherType;

  @ApiPropertyOptional({ enum: ExtinguisherSize })
  @IsOptional()
  @IsEnum(ExtinguisherSize)
  size?: ExtinguisherSize;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  installedAt?: Date;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatus;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  siteId?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
