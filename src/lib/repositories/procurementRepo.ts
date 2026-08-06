import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class ProcurementRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('procurement');
  }
}

export const procurementRepo = new ProcurementRepository();
