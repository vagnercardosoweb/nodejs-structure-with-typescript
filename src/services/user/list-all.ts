import { UserRepository } from '@/repositories';

export class UserListAllSvc {
  public constructor(protected readonly userRepository: UserRepository) {}

  public async execute({ limit, offset }: Input) {
    return this.userRepository.findWithLimit(limit, offset);
  }
}

type Input = {
  limit: number;
  offset: number;
};
