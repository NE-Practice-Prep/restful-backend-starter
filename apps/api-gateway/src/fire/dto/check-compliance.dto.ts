import { Type } from "class-transformer";
import { IsDate, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { ComplianceStatus } from "@shared/generated/prisma/enums";

export class CheckComplianceDto {
  @ApiProperty({ type: String })
  @IsString()
  extinguisherId!: string;

  @ApiProperty({ enum: ComplianceStatus })
  @IsEnum(ComplianceStatus)
  status!: ComplianceStatus;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  regulationRef?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date;
}
