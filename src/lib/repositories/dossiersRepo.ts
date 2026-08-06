import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class DossiersRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('dossiers');
  }
}

export const dossiersRepo = new DossiersRepository();
