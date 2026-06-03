import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

import { ExtinguisherType } from "@shared/common/enums/extinguisher-type.enum";
import {
  ComplianceStatus,
  ExtinguisherStatus,
} from "@shared/generated/prisma/enums";

export class ListExtinguishersQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatus;

  @ApiPropertyOptional({ enum: ComplianceStatus })
  @IsOptional()
  @IsEnum(ComplianceStatus)
  complianceStatus?: ComplianceStatus;

  @ApiPropertyOptional({ enum: ExtinguisherType })
  @IsOptional()
  @IsEnum(ExtinguisherType)
  type?: ExtinguisherType;
}

export function parseListExtinguishersQuery(query: ListExtinguishersQueryDto) {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    q: query.q?.trim() || undefined,
    status: query.status,
    complianceStatus: query.complianceStatus,
    type: query.type,
  };
}
