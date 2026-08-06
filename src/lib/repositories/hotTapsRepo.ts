import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class HotTapsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('hot_taps');
  }
}

export const hotTapsRepo = new HotTapsRepository();
