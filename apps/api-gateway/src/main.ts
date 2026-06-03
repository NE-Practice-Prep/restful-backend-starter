import "reflect-metadata";
import "dotenv/config";

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
    .setDescription("REST API Gateway for Restufl backend")
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

  const rawPort = (process.env.GATEWAY_PORT ?? process.env.PORT ?? "").trim();
  const parsedPort = rawPort.length > 0 ? Number(rawPort) : Number.NaN;
  const port =
    Number.isFinite(parsedPort) && parsedPort >= 0 && parsedPort <= 65535 ? parsedPort : 3001;

  await app.listen(port);
  console.log(`API Gateway running at http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api`);
  console.log(`OpenAPI docs at http://localhost:${port}/api-json`);
  console.log(`YAML docs at http://localhost:${port}/api-yaml`);

}

bootstrap().catch((error) => console.error("Failed to start API gateway", error));
