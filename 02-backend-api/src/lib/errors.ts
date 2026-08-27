/**
 * DomainError represents business-rule / data-integrity failures.
 * Routes translate it into a JSON error response with the given status.
 */
export class DomainError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "DomainError";
    this.status = status;
  }
}

export const domainError = {
  badRequest: (message: string) => new DomainError(400, message),
  forbidden: (message: string) => new DomainError(403, message),
  notFound: (message: string) => new DomainError(404, message),
  conflict: (message: string) => new DomainError(409, message),
};