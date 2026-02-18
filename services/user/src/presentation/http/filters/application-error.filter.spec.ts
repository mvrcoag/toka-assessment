import { ArgumentsHost } from '@nestjs/common';
import { ApplicationError } from '../../../application/errors/application-error';
import { DomainError } from '../../../domain/errors/domain-error';
import { ApplicationErrorFilter } from './application-error.filter';

describe('ApplicationErrorFilter', () => {
  it('maps application errors', () => {
    const status = jest.fn();
    const json = jest.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: () => ({ json }) }),
      }),
    } as unknown as ArgumentsHost;

    const filter = new ApplicationErrorFilter();
    filter.catch(new ApplicationError('bad', 409), host);
    expect(json).toHaveBeenCalledWith({ error: 'bad' });
  });

  it('maps domain errors', () => {
    const json = jest.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: () => ({ json }) }),
      }),
    } as unknown as ArgumentsHost;

    const filter = new ApplicationErrorFilter();
    filter.catch(new DomainError('bad'), host);
    expect(json).toHaveBeenCalledWith({ error: 'bad' });
  });
});
