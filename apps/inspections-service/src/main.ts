import "reflect-metadata";
import "dotenv/config";

import { NestFactory } from "@nestjs/core";
import { Transport, type MicroserviceOptions } from "@nestjs/microservices";

import { AppModule } from "./app.module";

async function bootstrap() {
  const host = (process.env.INSPECTIONS_SERVICE_HOST ?? "127.0.0.1").trim();
  const port = Number((process.env.INSPECTIONS_SERVICE_PORT ?? "3005").trim());

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: { host, port },
  });

  await app.listen();
  console.log(`Inspections microservice listening on ${host}:${port}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start inspections microservice", error);
  process.exit(1);
});
