import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({ type: String, example: "1234", minLength: 4, maxLength: 4 })
  @IsString()
  @Length(4, 4)
  code!: string;
}
