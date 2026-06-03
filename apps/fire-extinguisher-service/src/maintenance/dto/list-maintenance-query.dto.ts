import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ListMaintenanceQueryDto {
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
}

export function parseListMaintenanceQuery(query: ListMaintenanceQueryDto) {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    extinguisherId: query.extinguisherId,
  };
}
