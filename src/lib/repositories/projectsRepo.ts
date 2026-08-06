import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class ProjectsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('projects');
  }
}

export const projectsRepo = new ProjectsRepository();
