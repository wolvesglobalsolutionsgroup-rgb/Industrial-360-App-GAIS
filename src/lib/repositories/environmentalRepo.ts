import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class EnvironmentalAspectsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('environmental_aspects');
  }
}

export class RasdaManifestsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('rasda_manifests');
  }
}

export class EnvironmentalInspectionsRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('environmental_inspections');
  }
}

export const environmentalAspectsRepo = new EnvironmentalAspectsRepository();
export const rasdaManifestsRepo = new RasdaManifestsRepository();
export const environmentalInspectionsRepo = new EnvironmentalInspectionsRepository();
