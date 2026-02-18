import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { ApplicationError } from '../../../application/errors/application-error';
import { DomainError } from '../../../domain/errors/domain-error';

@Catch(ApplicationError, DomainError)
export class ApplicationErrorFilter implements ExceptionFilter {
  catch(exception: ApplicationError | DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof ApplicationError ? exception.statusCode : 400;
    response.status(statusCode).json({ error: exception.message });
  }
}
