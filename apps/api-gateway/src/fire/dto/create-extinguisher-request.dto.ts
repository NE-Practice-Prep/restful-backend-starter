import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

import { ExtinguisherSize, ExtinguisherType } from "@shared/generated/prisma/enums";

export class CreateExtinguisherRequestDto {
  @ApiPropertyOptional({ type: String, description: "Specific extinguisher ID if requesting a known unit" })
  @IsOptional()
  @IsString()
  extinguisherId?: string;

  @ApiPropertyOptional({ type: Number, description: "Number of extinguishers requested", minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;

  @ApiPropertyOptional({ enum: ExtinguisherType, description: "Preferred type" })
  @IsOptional()
  @IsEnum(ExtinguisherType)
  type?: ExtinguisherType;

  @ApiPropertyOptional({ enum: ExtinguisherSize, description: "Preferred size" })
  @IsOptional()
  @IsEnum(ExtinguisherSize)
  size?: ExtinguisherSize;

  @ApiPropertyOptional({ type: String, description: "Reason or notes for the request" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
