describe('main bootstrap', () => {
  it('creates nest app and listens', async () => {
    const use = jest.fn();
    const useGlobalPipes = jest.fn();
    const useGlobalFilters = jest.fn();
    const listen = jest.fn().mockResolvedValue(undefined);

    jest.resetModules();
    jest.doMock('express', () => ({
      urlencoded: jest.fn(() => 'middleware'),
    }));
    const core = require('@nestjs/core');
    jest.spyOn(core.NestFactory, 'create').mockResolvedValue({
      use,
      useGlobalPipes,
      useGlobalFilters,
      listen,
    });

    require('./main');
    await new Promise((resolve) => setImmediate(resolve));

    expect(core.NestFactory.create).toHaveBeenCalled();
    expect(use).toHaveBeenCalled();
    expect(useGlobalPipes).toHaveBeenCalled();
    expect(useGlobalFilters).toHaveBeenCalled();
    expect(listen).toHaveBeenCalled();
  });
});
