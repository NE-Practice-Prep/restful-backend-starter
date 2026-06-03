import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsString } from "class-validator";

import {
  ExtinguisherSize,
  ExtinguisherStatus,
  ExtinguisherType,
  type ExtinguisherSize as ExtinguisherSizeType,
  type ExtinguisherStatus as ExtinguisherStatusType,
  type ExtinguisherType as ExtinguisherTypeType,
} from "@shared/generated/prisma/enums";
import {
  EXTINGUISHER_SIZE_VALUES,
  EXTINGUISHER_STATUS_VALUES,
  EXTINGUISHER_TYPE_VALUES,
} from "@shared/common/enums/extinguisher.swagger";

export class CreateExtinguisherDto {
  @ApiProperty({ type: String, example: "FE-2024-001" })
  @IsString()
  serialNumber!: string;

  @ApiProperty({ type: String, example: "Building A — Floor 2" })
  @IsString()
  location!: string;

  @ApiProperty({ enum: EXTINGUISHER_TYPE_VALUES, example: "CO2" })
  @IsEnum(ExtinguisherType)
  type!: ExtinguisherTypeType;

  @ApiProperty({ enum: EXTINGUISHER_SIZE_VALUES, example: "Size5lb" })
  @IsEnum(ExtinguisherSize)
  size!: ExtinguisherSizeType;

  @ApiProperty({ type: String, example: "2024-01-15" })
  @IsDateString()
  installationDate!: string;

  @ApiProperty({ type: String, example: "2029-01-15" })
  @IsDateString()
  expiryDate!: string;

  @ApiProperty({ enum: EXTINGUISHER_STATUS_VALUES, example: "active" })
  @IsEnum(ExtinguisherStatus)
  status!: ExtinguisherStatusType;
}
