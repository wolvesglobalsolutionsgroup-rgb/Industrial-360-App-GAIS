import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export class WorkerAttendanceRepository extends BaseRepository<BaseEntity> {
  constructor() {
    super('worker_attendance');
  }
}

export const workerAttendanceRepo = new WorkerAttendanceRepository();
