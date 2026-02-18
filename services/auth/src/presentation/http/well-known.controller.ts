import { Controller, Get } from '@nestjs/common';
import { GetJwksUseCase } from '../../application/use-cases/get-jwks.use-case';
import { GetOpenIdConfigurationUseCase } from '../../application/use-cases/get-openid-configuration.use-case';

@Controller()
export class WellKnownController {
  constructor(
    private readonly getOpenIdConfiguration: GetOpenIdConfigurationUseCase,
    private readonly getJwks: GetJwksUseCase,
  ) {}

  @Get('.well-known/openid-configuration')
  openIdConfiguration() {
    return this.getOpenIdConfiguration.execute();
  }

  @Get('.well-known/jwks.json')
  jwks() {
    return this.getJwks.execute();
  }

  @Get('.well-know/jwks.json')
  legacyJwks() {
    return this.getJwks.execute();
  }
}
