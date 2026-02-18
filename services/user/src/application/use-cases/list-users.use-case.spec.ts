import { ListUsersUseCase } from './list-users.use-case';

describe('ListUsersUseCase', () => {
  it('lists users', async () => {
    const useCase = new ListUsersUseCase({
      findById: async () => null,
      findByEmail: async () => null,
      list: async () => [{ id: { value: 'user-1' } } as any],
      save: async () => undefined,
      delete: async () => undefined,
    });

    const users = await useCase.execute();
    expect(users).toHaveLength(1);
  });
});
