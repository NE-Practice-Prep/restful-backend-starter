import "reflect-metadata";
import "dotenv/config";

import { mkdirSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import type { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Transport, type MicroserviceOptions } from "@nestjs/microservices";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- TCP Microservice ---
  const rawMsPort = (process.env.MICROSERVICE_PORT ?? "").trim();
  const parsedMsPort = rawMsPort.length > 0 ? Number(rawMsPort) : Number.NaN;
  const msPort =
    Number.isFinite(parsedMsPort) && parsedMsPort >= 0 && parsedMsPort <= 65535
      ? parsedMsPort
      : 3002;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: "0.0.0.0", port: msPort },
  });

  // --- HTTP setup (unchanged) ---
  const uploadsDir = join(process.cwd(), "uploads");
  mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: "/uploads/" });

  const corsOrigin = (process.env.CORS_ORIGIN ?? "http://localhost:3000").trim();
  app.enableCors({
    origin: corsOrigin.split(",").map((value) => value.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Restufl API")
    .setDescription("REST API for Restufl backend")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  const openapiJsonPath = join(process.cwd(), "openapi.json");
  writeFileSync(openapiJsonPath, JSON.stringify(swaggerDocument, null, 2));

  SwaggerModule.setup("api", app, swaggerDocument, {
    raw: ["json", "yaml"],
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const rawPort = (process.env.PORT ?? "").trim();
  const parsedPort = rawPort.length > 0 ? Number(rawPort) : Number.NaN;
  const port =
    Number.isFinite(parsedPort) && parsedPort >= 0 && parsedPort <= 65535 ? parsedPort : 3001;

  await app.startAllMicroservices();
  await app.listen(port);
  console.log(`HTTP server running at http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api`);
  console.log(`TCP microservice listening on port ${msPort}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
