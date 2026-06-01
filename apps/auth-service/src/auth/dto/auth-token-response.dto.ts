import { ApiProperty } from "@nestjs/swagger";

import { CurrentUserResponseDto } from "../../common/dto/public-user.dto";

export class AuthTokenResponseDto {
  @ApiProperty({
    type: String,
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT access token",
  })
  accessToken!: string;

  @ApiProperty({ type: Number, example: 3600 })
  expiresIn!: number;

  @ApiProperty({ type: () => CurrentUserResponseDto })
  user!: CurrentUserResponseDto;

  @ApiProperty({ type: Boolean, example: true })
  emailVerified!: boolean;
}
