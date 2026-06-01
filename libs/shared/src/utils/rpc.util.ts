import { HttpException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

export type RpcErrorPayload = {
  statusCode: number;
  message: string | string[];
};

export function toRpcException(error: unknown): RpcException {
  if (error instanceof RpcException) {
    return error;
  }

  if (error instanceof HttpException) {
    const response = error.getResponse();
    const message =
      typeof response === "string"
        ? response
        : ((response as { message?: string | string[] }).message ?? error.message);

    return new RpcException({
      statusCode: error.getStatus(),
      message,
    } satisfies RpcErrorPayload);
  }

  if (error instanceof Error) {
    return new RpcException({
      statusCode: 500,
      message: error.message,
    } satisfies RpcErrorPayload);
  }

  return new RpcException({
    statusCode: 500,
    message: "Internal server error",
  } satisfies RpcErrorPayload);
}

export function getRpcErrorPayload(error: unknown): RpcErrorPayload {
  if (error instanceof RpcException) {
    const payload = error.getError();
    if (typeof payload === "object" && payload !== null && "statusCode" in payload) {
      return payload as RpcErrorPayload;
    }
    return {
      statusCode: 500,
      message: typeof payload === "string" ? payload : "Internal server error",
    };
  }

  return { statusCode: 500, message: "Internal server error" };
}
