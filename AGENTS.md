# AGENTS.md — Restful Backend (NestJS Microservices)

> Human-readable tour of the full stack (including NestJS basics): see repo root [`CODEBASE_GUIDE.md`](../../CODEBASE_GUIDE.md).

Parent guide: [`../../AGENTS.md`](../../AGENTS.md) · Project spec: [`../../PROJECTDESCRIPTION.md`](../../PROJECTDESCRIPTION.md)

---

## Prime directive

Extend this **API Gateway + TCP microservices + Prisma** backend for TZW fire extinguisher features **without** changing auth semantics, validation style, or RPC error handling.

---

## Architecture (preserve)

```
Client (Next.js :3000)
    → HTTP API Gateway (:3001)  — JWT, Swagger, ValidationPipe, CORS
        → TCP auth-service (:3002)
        → TCP users-service (:3003)
        → [add] extinguishers-service, inspections-service, …
    → PostgreSQL via Prisma (@shared PrismaService)
```

| App | Responsibility |
|-----|----------------|
| `api-gateway` | REST surface, `JwtAuthGuard`, `RolesGuard`, `MicroserviceProxyService` |
| `auth-service` | Register, login, logout, verify email, forgot/reset password, change password (RPC) |
| `users-service` | User CRUD, profile, avatar (RPC) |

**Do not** put HTTP controllers in worker services—only `@MessagePattern` handlers.

---

## Stack (do not replace)

| Layer | Use |
|-------|-----|
| Runtime | Node ESM, `tsx` for dev |
| Framework | NestJS 11 |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Auth | `@nestjs/jwt`, `passport-jwt`, bcrypt |
| Validation | `class-validator`, `class-transformer` |
| Docs | `@nestjs/swagger` on gateway; writes `openapi.json` on boot |
| Tests | Vitest (`*.service.spec.ts`) |
| Email | `libs/shared/src/email/email.service.ts` (nodemailer) |

---

## Global gateway rules

From `apps/api-gateway/src/main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
);
```

- Every new HTTP body/query DTO must use validation decorators.
- CORS: `CORS_ORIGIN` (default `http://localhost:3000`).

---

## Auth & authorization (preserve)

| Concern | Location |
|---------|----------|
| JWT strategy | `api-gateway/src/auth/strategies/jwt.strategy.ts` |
| Guards | `JwtAuthGuard`, `RolesGuard` |
| Role decorator | `@Roles(Role.admin)` etc. |
| RPC auth | `auth-service` — no HTTP; patterns in `AUTH_PATTERNS` |

**Roles in schema:** `admin` | `editor` | `viewer` (map TZW Inspector → `editor`, User → `viewer`).

**Public HTTP routes (auth controller):** register, login, logout (optional token), forgot-password, verify-reset-password, reset-password.

**Protected:** verify-email, resend-verification, all `/users/*` as implemented.

---

## RPC pattern (required for new services)

1. Define patterns in `libs/shared/src/microservices/patterns.ts`.
2. Service controller:

```typescript
@MessagePattern(FOO_PATTERNS.CREATE)
async create(@Payload() dto: CreateFooDto) {
  try {
    return await this.fooService.create(dto);
  } catch (e: unknown) {
    throw toRpcException(e);
  }
}
```

3. Gateway:

```typescript
return this.proxy.send(this.fooClient, FOO_PATTERNS.CREATE, dto);
```

4. Errors: `libs/shared/src/utils/rpc.util.ts` — `getRpcErrorPayload` must support RpcException **and** plain `{ statusCode, message }` from TCP.

---

## DTO conventions

- Gateway DTOs under `apps/api-gateway/src/<domain>/dto/`.
- Service DTOs under `apps/<service>/src/<domain>/dto/` (keep in sync or share via `libs/shared` when identical).
- Use `@ApiProperty`, `@IsEmail`, `@MinLength`, `@IsEnum`, `@IsOptional`, etc.
- Register: `firstName`, `lastName`, `email`, `password`, `acceptTerms` (must be `true`). Always creates **`Role.viewer`** (`PUBLIC_SIGNUP_ROLE`); no `role` on DTO. Inspectors/admins via admin `POST /users` only.

---

## Prisma conventions

- Schema: `prisma/schema.prisma`
- Client output: `libs/shared/src/generated/prisma`
- Access: `PrismaService` / `createPrismaClient()` from `libs/shared/src/lib/prisma.ts`
- Requires `DATABASE_URL` in `.env`
- Migrations: `pnpm run db:migrate` or `db:push` for dev
- Seed: `prisma/seed.ts` — `pnpm run db:seed`

New TZW entities (extinguisher, inspection, maintenance) get explicit enums for type/size/status; use `@unique` on serial numbers.

---

## Email & verification

- Registration sets `emailVerified: false`, stores OTP, sends via `EmailService.sendVerificationCode`.
- If SMTP unset or send fails: log code; in non-production may return `devVerificationCode` on register/resend responses.
- Password reset: `forgotPassword` → email OTP → `verifyResetPassword` → `resetPassword` with session token.

**Never** commit real SMTP passwords; use Gmail App Passwords in local `.env` only.

---

## Adding a new microservice

1. Copy `apps/users-service` folder structure → `apps/extinguishers-service`.
2. `main.ts`: TCP host/port from env (`EXTINGUISHERS_SERVICE_HOST`, `EXTINGUISHERS_SERVICE_PORT`).
3. Register in root `package.json` scripts (`dev:extinguishers`, update `dev:all` if used).
4. `api-gateway` `ClientsModule.register` + inject `MicroserviceProxyService`.
5. Gateway module + controller with Swagger tags.
6. Shared types/mappers in `libs/shared` when reused by multiple services.

---

## Testing

- Unit test services with mocked `PrismaService`, `JwtService`, `EmailService`.
- Use `vi.mock("bcrypt")` pattern from `auth.service.spec.ts`.
- Run: `pnpm test`

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Tokens |
| `PORT` / `GATEWAY_PORT` | Gateway (3001) |
| `AUTH_SERVICE_HOST`, `AUTH_SERVICE_PORT` | 127.0.0.1:3002 |
| `USERS_SERVICE_HOST`, `USERS_SERVICE_PORT` | 127.0.0.1:3003 |
| `CORS_ORIGIN` | Frontend origin |
| `SMTP_*` | Optional email |
| `APP_URL` | Links in emails |

---

## Must not

- Skip `toRpcException` in microservice controllers
- Return generic 500 for known HTTP exceptions (fix `getRpcErrorPayload` if needed)
- Add Prisma calls directly in gateway controllers
- Store passwords except as bcrypt hashes
- Remove Swagger from gateway or global ValidationPipe
- Break existing `/auth/*` or `/users/*` contracts without updating frontend `lib/api/*`

---

## Commands

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma db push
pnpm run db:seed
npx tsx apps/api-gateway/src/main.ts
npx tsx apps/auth-service/src/main.ts
npx tsx apps/users-service/src/main.ts
```

Swagger: http://localhost:3001/api
