import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

import {
  ExtinguisherStatus,
  ExtinguisherType,
  type ExtinguisherStatus as ExtinguisherStatusType,
  type ExtinguisherType as ExtinguisherTypeType,
} from "@shared/generated/prisma/enums";
import {
  EXTINGUISHER_STATUS_VALUES,
  EXTINGUISHER_TYPE_VALUES,
} from "@shared/common/enums/extinguisher.swagger";

export class ListExtinguishersQueryDto {
  @ApiPropertyOptional({ type: String, description: "Search serial number or location" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: EXTINGUISHER_STATUS_VALUES })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatusType;

  @ApiPropertyOptional({ enum: EXTINGUISHER_TYPE_VALUES })
  @IsOptional()
  @IsEnum(ExtinguisherType)
  type?: ExtinguisherTypeType;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export function parseListExtinguishersQuery(query: ListExtinguishersQueryDto) {
  const page = Number(query.page);
  const limit = Number(query.limit);

  return {
    q: query.q?.trim() ?? "",
    status: query.status,
    type: query.type,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    limit: Number.isFinite(limit) && limit >= 1 ? Math.min(limit, 100) : 10,
  };
}
