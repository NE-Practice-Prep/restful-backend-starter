import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { PrismaService } from "../../prisma/prisma.service";
import { Role } from "../../common/enums/role.enum";
import { UserStatus } from "../../common/enums/user-status.enum";
import type { AuthenticatedUser } from "../types/authenticated-user.type";
import type { JwtPayload } from "../jwt-payload.type";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    const jwtSecret = (process.env.JWT_SECRET ?? "").trim();
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is required");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status === UserStatus.suspended) {
      throw new UnauthorizedException("Invalid or inactive session");
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    };
  }
}
