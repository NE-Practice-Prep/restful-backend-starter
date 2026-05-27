import { IsOptional, IsString } from "class-validator";

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  name?: string | null;
}

