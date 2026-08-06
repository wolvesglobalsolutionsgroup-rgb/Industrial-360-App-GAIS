import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class LotoIsolationsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('loto_isolations');
  }
}

export const lotoIsolationsRepo = new LotoIsolationsRepository();
