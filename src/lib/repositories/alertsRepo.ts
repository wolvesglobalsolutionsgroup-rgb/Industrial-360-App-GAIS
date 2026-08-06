import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class AlertsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('alerts');
  }
}

export const alertsRepo = new AlertsRepository();
