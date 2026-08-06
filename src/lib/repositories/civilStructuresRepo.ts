import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class CivilStructuresRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('civil_structures');
  }
}

export const civilStructuresRepo = new CivilStructuresRepository();
