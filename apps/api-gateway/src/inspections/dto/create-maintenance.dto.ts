import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMaintenanceDto {
  @ApiProperty({ description: "Fire extinguisher that was serviced" })
  @IsString()
  @IsNotEmpty()
  extinguisherId!: string;

  @ApiProperty({ example: "Replaced pressure gauge" })
  @IsString()
  @IsNotEmpty()
  actionTaken!: string;

  @ApiProperty({ example: "2026-06-03" })
  @IsDateString()
  maintenanceDate!: string;

  @ApiPropertyOptional({ default: "" })
  @IsOptional()
  @IsString()
  issuesIdentified?: string;

  @ApiPropertyOptional({ default: "" })
  @IsOptional()
  @IsString()
  notes?: string;
}
