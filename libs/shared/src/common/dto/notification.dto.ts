import { ApiProperty } from "@nestjs/swagger";

export class NotificationDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  type!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String })
  message!: string;

  @ApiProperty({ type: Boolean })
  read!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;
}
