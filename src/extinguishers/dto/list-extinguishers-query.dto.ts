import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class ListExtinguishersQueryDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ["available", "assigned", "retired", "all"] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ enum: ["active", "expiring_soon", "expired", "all"] })
  @IsOptional()
  @IsString()
  lifecycle?: string;

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
    status: query.status === "all" || !query.status ? undefined : query.status,
    customerId: query.customerId?.trim() || undefined,
    lifecycle: query.lifecycle === "all" || !query.lifecycle ? undefined : query.lifecycle,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    limit: Number.isFinite(limit) && limit >= 1 ? Math.min(limit, 100) : 10,
  } as const;
}
