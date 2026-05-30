import { ApiProperty } from "@nestjs/swagger";

import { AuthenticatedUserDto } from "./authenticated-user.dto";

export class AuthTokenResponseDto {
  @ApiProperty({
    type: String,
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT access token",
  })
  accessToken!: string;

  @ApiProperty({ type: () => AuthenticatedUserDto })
  user!: AuthenticatedUserDto;
}
