import { CreateAuditLogUseCase } from './create-audit-log.use-case';
import { ApplicationError } from '../errors/application-error';

describe('CreateAuditLogUseCase', () => {
  it('creates and saves audit log', async () => {
    const useCase = new CreateAuditLogUseCase({
      save: async (log) => log,
      findById: async () => null,
      list: async () => [],
    });

    const log = await useCase.execute({
      action: 'user.created',
      resource: 'user',
      actorId: 'user-1',
      actorRole: 'admin',
      metadata: { name: 'Toka' },
    });

    expect(log.action.value).toBe('user.created');
    expect(log.resource.value).toBe('user');
  });

  it('rejects missing inputs', async () => {
    const useCase = new CreateAuditLogUseCase({
      save: async (log) => log,
      findById: async () => null,
      list: async () => [],
    });

    await expect(
      useCase.execute({ action: '', resource: '' }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
