import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

import { InspectionStatus } from "@shared/common/enums/inspection-status.enum";

export class ListInspectionsQueryDto {
  @ApiPropertyOptional({ enum: InspectionStatus })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @ApiPropertyOptional({ description: "Filter by fire extinguisher ID" })
  @IsOptional()
  @IsString()
  extinguisherId?: string;

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

export function parseListInspectionsQuery(query: ListInspectionsQueryDto) {
  const page = Number(query.page);
  const limit = Number(query.limit);

  return {
    status: query.status,
    extinguisherId: query.extinguisherId?.trim() || undefined,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    limit: Number.isFinite(limit) && limit >= 1 ? Math.min(limit, 100) : 10,
  };
}

export class ListMaintenanceQueryDto {
  @ApiPropertyOptional({ description: "Filter by fire extinguisher ID" })
  @IsOptional()
  @IsString()
  extinguisherId?: string;

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

export function parseListMaintenanceQuery(query: ListMaintenanceQueryDto) {
  const page = Number(query.page);
  const limit = Number(query.limit);

  return {
    extinguisherId: query.extinguisherId?.trim() || undefined,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    limit: Number.isFinite(limit) && limit >= 1 ? Math.min(limit, 100) : 10,
  };
}
