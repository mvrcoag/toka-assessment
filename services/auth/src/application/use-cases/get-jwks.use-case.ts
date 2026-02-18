import { TokenService } from '../ports/token-service';

export class GetJwksUseCase {
  constructor(private readonly tokenService: TokenService) {}

  async execute(): Promise<Record<string, unknown>> {
    return this.tokenService.getJwks();
  }
}
