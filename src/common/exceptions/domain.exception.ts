export class DomainException extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export class ConflictDomainException extends DomainException {
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(message, 409, code, details);
  }
}

export class NotFoundDomainException extends DomainException {
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(message, 404, code, details);
  }
}

export class ValidationDomainException extends DomainException {
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(message, 422, code, details);
  }
}
