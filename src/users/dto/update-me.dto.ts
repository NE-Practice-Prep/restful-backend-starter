import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateMeDto {
  @ApiPropertyOptional({ type: String, example: "Jane Doe", nullable: true })
  @IsOptional()
  @IsString()
  name?: string | null;
}
