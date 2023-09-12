import { AbstractHandler } from '@/rest-api/handler';

export class HealthyHandler extends AbstractHandler {
  public handle() {
    return '🚀';
  }
}
