import { Global, Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { AUTH_SERVICE, FIRE_SERVICE, REPORTING_SERVICE, USERS_SERVICE } from "./microservices.constants";
import { MicroserviceProxyService } from "./microservice-proxy.service";

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: AUTH_SERVICE,
        transport: Transport.TCP,
        options: {
          host: (process.env.AUTH_SERVICE_HOST ?? "127.0.0.1").trim(),
          port: Number((process.env.AUTH_SERVICE_PORT ?? "3002").trim()),
        },
      },
      {
        name: USERS_SERVICE,
        transport: Transport.TCP,
        options: {
          host: (process.env.USERS_SERVICE_HOST ?? "127.0.0.1").trim(),
          port: Number((process.env.USERS_SERVICE_PORT ?? "3003").trim()),
        },
      },
      {
        name: FIRE_SERVICE,
        transport: Transport.TCP,
        options: {
          host: (process.env.FIRE_SERVICE_HOST ?? "127.0.0.1").trim(),
          port: Number((process.env.FIRE_SERVICE_PORT ?? "3004").trim()),
        },
      },
      {
        name: REPORTING_SERVICE,
        transport: Transport.TCP,
        options: {
          host: (process.env.REPORTING_SERVICE_HOST ?? "127.0.0.1").trim(),
          port: Number((process.env.REPORTING_SERVICE_PORT ?? "3005").trim()),
        },
      },
    ]),
  ],
  providers: [MicroserviceProxyService],
  exports: [ClientsModule, MicroserviceProxyService],
})
export class MicroservicesModule {}
