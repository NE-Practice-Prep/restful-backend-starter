import { IsOptional, IsString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ReviewRequestDto {
  @ApiPropertyOptional({ type: String, description: "Notes for the requester about this decision" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;
}
