import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ type: String, example: "currentPass123", minLength: 8 })
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty({ type: String, example: "newSecurePass456", minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
