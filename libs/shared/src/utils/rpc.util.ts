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
    return normalizeRpcErrorPayload(error.getError());
  }

  // Errors thrown inside a microservice are serialized across the transport and
  // arrive on the client as plain objects, not RpcException instances. Without
  // this branch, a 404/409/etc. would be reported to the caller as a 500.
  return normalizeRpcErrorPayload(error);
}

function normalizeRpcErrorPayload(payload: unknown): RpcErrorPayload {
  if (typeof payload === "string") {
    return { statusCode: 500, message: payload };
  }

  if (typeof payload === "object" && payload !== null) {
    const candidate = payload as {
      statusCode?: unknown;
      status?: unknown;
      message?: unknown;
    };

    const statusCode =
      typeof candidate.statusCode === "number"
        ? candidate.statusCode
        : typeof candidate.status === "number"
          ? candidate.status
          : 500;

    const message =
      typeof candidate.message === "string" || Array.isArray(candidate.message)
        ? (candidate.message as string | string[])
        : "Internal server error";

    return { statusCode, message };
  }

  return { statusCode: 500, message: "Internal server error" };
}
