import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

import { Role } from "@shared/common/enums/role.enum";
import { UserStatus } from "@shared/common/enums/user-status.enum";

export class ListUsersQueryDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ["admin", "editor", "viewer", "all"] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ enum: ["active", "invited", "suspended", "all"] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ["createdAt"] })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  order?: "asc" | "desc";

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export function parseListUsersQuery(query: ListUsersQueryDto) {
  const page = Number(query.page);
  const limit = Number(query.limit);

  return {
    q: query.q?.trim() ?? "",
    role: query.role === "all" || !query.role ? undefined : (query.role as Role),
    status:
      query.status === "all" || !query.status ? undefined : (query.status as UserStatus),
    sort: query.sort ?? "createdAt",
    order: query.order ?? "desc",
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    limit: Number.isFinite(limit) && limit >= 1 ? Math.min(limit, 100) : 5,
  };
}
