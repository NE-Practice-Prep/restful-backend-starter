import "reflect-metadata";
import "dotenv/config";

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
    Number.isFinite(parsedPort) && parsedPort >= 0 && parsedPort <= 65535 ? parsedPort : 3000;
  await app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api`);
  console.log(`OpenAPI JSON at http://localhost:${port}/api-json`);
  console.log(`OpenAPI YAML at http://localhost:${port}/api-yaml`);
  console.log(`OpenAPI spec exported to ${openapiJsonPath}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
