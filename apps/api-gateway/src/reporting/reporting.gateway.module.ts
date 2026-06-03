import { Module } from "@nestjs/common";

import { ReportingGatewayController } from "./reporting.gateway.controller";

@Module({
  controllers: [ReportingGatewayController],
})
export class ReportingGatewayModule {}
