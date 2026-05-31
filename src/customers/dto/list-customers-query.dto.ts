import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class ListCustomersQueryDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ["createdAt", "name"] })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  @IsOptional()
  @IsString()
  order?: "asc" | "desc";

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

export function parseListCustomersQuery(query: ListCustomersQueryDto) {
  const page = Number(query.page);
  const limit = Number(query.limit);

  return {
    q: query.q?.trim() ?? "",
    sort: query.sort === "name" ? "name" : "createdAt",
    order: query.order === "asc" ? "asc" : "desc",
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    limit: Number.isFinite(limit) && limit >= 1 ? Math.min(limit, 100) : 10,
  } as const;
}
