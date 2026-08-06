import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class InstrumentLoopsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('instrument_loops');
  }
}

export const instrumentLoopsRepo = new InstrumentLoopsRepository();
