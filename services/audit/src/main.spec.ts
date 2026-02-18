describe('main bootstrap', () => {
  it('creates nest app and listens', async () => {
    const useGlobalPipes = jest.fn();
    const useGlobalFilters = jest.fn();
    const listen = jest.fn().mockResolvedValue(undefined);

    jest.resetModules();
    const core = require('@nestjs/core');
    jest.spyOn(core.NestFactory, 'create').mockResolvedValue({
      useGlobalPipes,
      useGlobalFilters,
      listen,
    });

    require('./main');
    await new Promise((resolve) => setImmediate(resolve));

    expect(core.NestFactory.create).toHaveBeenCalled();
    expect(useGlobalPipes).toHaveBeenCalled();
    expect(useGlobalFilters).toHaveBeenCalled();
    expect(listen).toHaveBeenCalled();
  });
});
