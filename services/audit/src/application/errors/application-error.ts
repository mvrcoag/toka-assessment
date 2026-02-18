export class ApplicationError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'ApplicationError';
    this.statusCode = statusCode;
  }
}
