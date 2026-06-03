import { HttpException, Injectable, Logger } from "@nestjs/common";
import type { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

import { getRpcErrorPayload } from "@shared/utils/rpc.util";

@Injectable()
export class MicroserviceProxyService {
  private readonly logger = new Logger(MicroserviceProxyService.name);

  async send<T>(client: ClientProxy, pattern: string, data: unknown): Promise<T> {
    try {
      return await firstValueFrom(client.send<T>(pattern, data));
    } catch (error: unknown) {
      const { statusCode, message } = getRpcErrorPayload(error);
      this.logger.error(
        `Microservice call failed for pattern "${pattern}" -> status=${statusCode} message=${JSON.stringify(
          message,
        )}`,
      );
      throw new HttpException(message, statusCode);
    }
  }
}
