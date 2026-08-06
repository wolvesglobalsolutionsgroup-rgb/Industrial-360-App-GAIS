import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class WbsSnapshotsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('wbs_snapshots');
  }
}

export const wbsSnapshotsRepo = new WbsSnapshotsRepository();
