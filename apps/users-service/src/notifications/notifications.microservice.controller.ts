import { Controller, Inject } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

import { USERS_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import { ExpiryNotificationsService } from "./expiry-notifications.service";

/** Email-only notifications — no in-app list/mark RPC. */
@Controller()
export class NotificationsMicroserviceController {
  constructor(
    @Inject(ExpiryNotificationsService) private readonly expiry: ExpiryNotificationsService,
  ) {}

  @MessagePattern(USERS_PATTERNS.NOTIFICATIONS_RUN_EXPIRY_CHECK)
  async runExpiryCheck() {
    try {
      return await this.expiry.runExpiryChecks();
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
