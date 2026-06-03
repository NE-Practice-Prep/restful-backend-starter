/**
 * Bridges HTTP (gateway) to TCP (microservices).
 * Converts Nest HTTP errors from RPC failures so the browser gets 401/403/404 instead of 500.
 */
import { HttpException, Injectable } from "@nestjs/common";
import type { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

import { getRpcErrorPayload } from "@shared/utils/rpc.util";

@Injectable()
export class MicroserviceProxyService {
  /** Fire-and-wait RPC: pattern must match @MessagePattern on the target service */
  async send<T>(client: ClientProxy, pattern: string, data: unknown): Promise<T> {
    try {
      return await firstValueFrom(client.send<T>(pattern, data));
    } catch (error: unknown) {
      const { statusCode, message } = getRpcErrorPayload(error);
      throw new HttpException(message, statusCode);
    }
  }
}
