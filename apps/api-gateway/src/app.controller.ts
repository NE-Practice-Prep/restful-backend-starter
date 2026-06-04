import { Controller, Get } from "@nestjs/common";

/** Root health/info endpoint for the API gateway (no microservice proxy). */
@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: "Restufl API Gateway",
    };
  }
}
