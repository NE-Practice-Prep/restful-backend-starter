import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class SubmitRenewalDto {
  @ApiProperty({ type: String })
  @IsString()
  extinguisherId!: string;
}

export class ApproveRenewalDto {
  @ApiProperty({ type: String })
  @IsString()
  replacementExtinguisherId!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class RejectRenewalDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  adminNote?: string;
}
