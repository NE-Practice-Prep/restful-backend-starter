import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ScheduleInspectionDto {
  @ApiProperty({ type: String })
  @IsString()
  extinguisherId!: string;

  @ApiProperty({ type: String, format: "date-time" })
  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @ApiPropertyOptional({ type: String, description: "Assign a specific inspector" })
  @IsOptional()
  @IsString()
  inspectorId?: string;
}
