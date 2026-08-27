import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: unknown;
}

export function send<T>(status: number, data: T): NextResponse {
  return NextResponse.json(data, { status });
}

export function sendOk<T>(data: T, status = 200): NextResponse {
  return send(status, data);
}

export function sendError(
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
  const body: ApiErrorBody = { error: httpStatusLabel(status), message };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export const badRequest = (msg = "Invalid request", details?: unknown) => sendError(msg, 400, details);
export const unauthorized = (msg = "Authentication required") => sendError(msg, 401);
export const forbidden = (msg = "You are not allowed to perform this action") => sendError(msg, 403);
export const notFound = (msg = "Resource not found") => sendError(msg, 404);
export const conflict = (msg = "Resource already exists") => sendError(msg, 409);

function httpStatusLabel(status: number): string {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    default:
      return "error";
  }
}