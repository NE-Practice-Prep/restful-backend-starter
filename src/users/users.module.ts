import { Module } from "@nestjs/common";

import { UsersController } from "./users.controller";
import { UsersMicroserviceController } from "./users.microservice.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController, UsersMicroserviceController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
