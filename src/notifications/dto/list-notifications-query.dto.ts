import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({
    type: Boolean,
    description: "When true, return only unread notifications",
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  unreadOnly?: boolean;
}
