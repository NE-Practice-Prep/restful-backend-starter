import { IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;
}
