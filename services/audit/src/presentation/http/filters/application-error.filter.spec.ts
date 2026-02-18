import { ArgumentsHost } from '@nestjs/common';
import { ApplicationErrorFilter } from './application-error.filter';
import { ApplicationError } from '../../../application/errors/application-error';
import { DomainError } from '../../../domain/errors/domain-error';

describe('ApplicationErrorFilter', () => {
  it('maps application errors', () => {
    const filter = new ApplicationErrorFilter();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as ArgumentsHost;

    filter.catch(new ApplicationError('bad', 409), host);
    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({ error: 'bad' });
  });

  it('maps domain errors', () => {
    const filter = new ApplicationErrorFilter();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as ArgumentsHost;

    filter.catch(new DomainError('invalid'), host);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ error: 'invalid' });
  });
});
