import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class ClientPortalsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('client_portals');
  }
}

export const clientPortalsRepo = new ClientPortalsRepository();
