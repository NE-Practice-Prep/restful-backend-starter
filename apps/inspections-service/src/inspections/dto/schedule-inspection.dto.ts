import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ScheduleInspectionDto {
  @ApiProperty({ description: "Fire extinguisher to inspect" })
  @IsString()
  @IsNotEmpty()
  extinguisherId!: string;

  @ApiProperty({ example: "2026-06-15" })
  @IsDateString()
  scheduledDate!: string;

  @ApiProperty({ example: "09:30" })
  @IsString()
  @IsNotEmpty()
  scheduledTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
