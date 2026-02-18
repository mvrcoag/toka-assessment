import { ArgumentsHost } from '@nestjs/common';
import { ApplicationError } from '../../../application/errors/application-error';
import { DomainError } from '../../../domain/errors/domain-error';
import { ApplicationErrorFilter } from './application-error.filter';

describe('ApplicationErrorFilter', () => {
  const buildHost = () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
    return { host, response };
  };

  it('maps application errors to status code', () => {
    const filter = new ApplicationErrorFilter();
    const { host, response } = buildHost();
    filter.catch(new ApplicationError('bad', 409), host);
    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({ error: 'bad' });
  });

  it('maps domain errors to 400', () => {
    const filter = new ApplicationErrorFilter();
    const { host, response } = buildHost();
    filter.catch(new DomainError('bad'), host);
    expect(response.status).toHaveBeenCalledWith(400);
  });
});
