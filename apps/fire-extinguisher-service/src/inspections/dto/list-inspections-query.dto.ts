import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

import { InspectionStatus } from "@shared/generated/prisma/enums";

export class ListInspectionsQueryDto {
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
  extinguisherId?: string;

  @ApiPropertyOptional({ enum: InspectionStatus })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;
}

export function parseListInspectionsQuery(query: ListInspectionsQueryDto) {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    extinguisherId: query.extinguisherId,
    status: query.status,
  };
}
