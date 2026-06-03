/**
 * Auth microservice — no public HTTP. Listens on TCP (default 3002) for patterns like auth.login.
 * The API Gateway is the only HTTP entry; it forwards login/register here via MicroserviceProxyService.
 */
/**
 * Auth microservice — TCP only (no public HTTP). Listens for patterns like "auth.login".
 * Start before or with the gateway; gateway connects to AUTH_SERVICE_PORT (default 3002).
 */
import "reflect-metadata";
import "dotenv/config";

import { NestFactory } from "@nestjs/core";
import { Transport, type MicroserviceOptions } from "@nestjs/microservices";

import { AppModule } from "./app.module";

async function bootstrap() {
  const host = (process.env.AUTH_SERVICE_HOST ?? "127.0.0.1").trim();
  const port = Number((process.env.AUTH_SERVICE_PORT ?? "3002").trim());

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: { host, port },
  });

  await app.listen();
  console.log(`Auth microservice listening on ${host}:${port}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start auth microservice", error);
  process.exit(1);
});
