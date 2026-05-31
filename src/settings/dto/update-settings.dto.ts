import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Max, Min } from "class-validator";

export class UpdateSettingsDto {
  @ApiProperty({ type: Number, example: 30, description: "Days before expiry to warn" })
  @IsInt()
  @Min(1)
  @Max(365)
  expiryWarningDays!: number;
}
