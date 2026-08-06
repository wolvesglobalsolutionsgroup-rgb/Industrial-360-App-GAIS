import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { BaseRepository } from './baseRepo';
import { FleetEquipmentItem, HorometerLogEntry, FuelLogEntry } from './types';

export class FleetEquipmentRepository extends BaseRepository<FleetEquipmentItem> {
  constructor() {
    super('fleet_equipment');
  }

  /**
   * Log horometer update in subcollection /fleet_equipment/{equipmentId}/horometer_logs
   */
  async logHorometerEntry(
    orgId: string,
    projectId: string,
    equipmentId: string,
    entry: Omit<HorometerLogEntry, 'id' | 'orgId' | 'projectId' | 'createdAt' | 'updatedAt'>
  ): Promise<HorometerLogEntry> {
    if (!orgId || !projectId || !equipmentId) {
      throw new Error('orgId, projectId y equipmentId son obligatorios.');
    }
    const path = `organizations/${orgId}/projects/${projectId}/fleet_equipment/${equipmentId}/horometer_logs`;
    const now = new Date().toISOString();
    const payload = {
      ...entry,
      equipmentId,
      orgId,
      projectId,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const ref = await addDoc(collection(db, path), payload);
      return { id: ref.id, ...payload } as HorometerLogEntry;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `fleet_equipment/${equipmentId}/horometer_logs`);
      throw err;
    }
  }

  /**
   * Get horometer logs for an equipment
   */
  async getHorometerLogs(orgId: string, projectId: string, equipmentId: string, maxLimit = 50): Promise<HorometerLogEntry[]> {
    if (!orgId || !projectId || !equipmentId) return [];
    const safeLimit = Math.min(Math.max(maxLimit, 1), 50);
    const path = `organizations/${orgId}/projects/${projectId}/fleet_equipment/${equipmentId}/horometer_logs`;
    try {
      const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc'), limit(safeLimit)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as HorometerLogEntry));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `fleet_equipment/${equipmentId}/horometer_logs`);
      return [];
    }
  }

  /**
   * Log fuel event in subcollection /fleet_equipment/{equipmentId}/fuel_logs
   */
  async logFuelEntry(
    orgId: string,
    projectId: string,
    equipmentId: string,
    entry: Omit<FuelLogEntry, 'id' | 'orgId' | 'projectId' | 'createdAt' | 'updatedAt'>
  ): Promise<FuelLogEntry> {
    if (!orgId || !projectId || !equipmentId) {
      throw new Error('orgId, projectId y equipmentId son obligatorios.');
    }
    const path = `organizations/${orgId}/projects/${projectId}/fleet_equipment/${equipmentId}/fuel_logs`;
    const now = new Date().toISOString();
    const payload = {
      ...entry,
      equipmentId,
      orgId,
      projectId,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const ref = await addDoc(collection(db, path), payload);
      return { id: ref.id, ...payload } as FuelLogEntry;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `fleet_equipment/${equipmentId}/fuel_logs`);
      throw err;
    }
  }

  /**
   * Get fuel logs for an equipment
   */
  async getFuelLogs(orgId: string, projectId: string, equipmentId: string, maxLimit = 50): Promise<FuelLogEntry[]> {
    if (!orgId || !projectId || !equipmentId) return [];
    const safeLimit = Math.min(Math.max(maxLimit, 1), 50);
    const path = `organizations/${orgId}/projects/${projectId}/fleet_equipment/${equipmentId}/fuel_logs`;
    try {
      const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc'), limit(safeLimit)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FuelLogEntry));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `fleet_equipment/${equipmentId}/fuel_logs`);
      return [];
    }
  }
}

export const fleetEquipmentRepo = new FleetEquipmentRepository();
