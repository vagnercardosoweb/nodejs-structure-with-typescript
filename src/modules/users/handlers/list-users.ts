import { Request, Response } from 'express';

import { UserRepository } from '@/modules/users';
import { AbstractHandler } from '@/rest-api/handler';
import { ContainerName, PgPoolInterface } from '@/shared';

export class ListUserHandler extends AbstractHandler {
  protected readonly pgPool: PgPoolInterface;
  protected readonly userRepository: UserRepository;

  constructor(request: Request, response: Response) {
    super(request, response);
    this.pgPool = this.container.get(ContainerName.PG_POOL);
    this.userRepository = new UserRepository(this.pgPool);
  }

  public async handle() {
    return this.userRepository.findAll({
      columns: ['id', 'name', 'email'],
      limit: 5,
    });
  }
}
