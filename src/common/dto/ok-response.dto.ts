import { ApiProperty } from "@nestjs/swagger";

export class OkResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: boolean;
}
