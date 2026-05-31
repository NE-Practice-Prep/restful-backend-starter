import { Module } from "@nestjs/common";

import { SettingsModule } from "../settings/settings.module";
import { ExtinguishersController } from "./extinguishers.controller";
import { ExtinguishersService } from "./extinguishers.service";

@Module({
  imports: [SettingsModule],
  controllers: [ExtinguishersController],
  providers: [ExtinguishersService],
  exports: [ExtinguishersService],
})
export class ExtinguishersModule {}
