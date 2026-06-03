import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

import { ExtinguisherSize, ExtinguisherType } from "@shared/generated/prisma/enums";

export class CreateRequestDto {
  @IsOptional()
  @IsString()
  extinguisherId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;

  @IsOptional()
  @IsEnum(ExtinguisherType)
  type?: ExtinguisherType;

  @IsOptional()
  @IsEnum(ExtinguisherSize)
  size?: ExtinguisherSize;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
