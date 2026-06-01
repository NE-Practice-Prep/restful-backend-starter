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

function isRpcErrorPayload(value: unknown): value is RpcErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "statusCode" in value &&
    typeof (value as RpcErrorPayload).statusCode === "number" &&
    "message" in value
  );
}

export function getRpcErrorPayload(error: unknown): RpcErrorPayload {
  if (error instanceof RpcException) {
    const payload = error.getError();
    if (isRpcErrorPayload(payload)) {
      return payload;
    }
    return {
      statusCode: 500,
      message: typeof payload === "string" ? payload : "Internal server error",
    };
  }

  if (isRpcErrorPayload(error)) {
    return error;
  }

  return { statusCode: 500, message: "Internal server error" };
}
