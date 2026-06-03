import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignExtinguisherDto {
  @ApiProperty({ type: String, description: "User ID to assign the extinguisher to" })
  @IsString()
  userId!: string;
}
