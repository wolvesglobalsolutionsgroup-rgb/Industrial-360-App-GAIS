import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class StandbyClaimsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('standby_claims');
  }
}

export class MocRequestsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('moc_requests');
  }
}

export const standbyClaimsRepo = new StandbyClaimsRepository();
export const mocRequestsRepo = new MocRequestsRepository();
