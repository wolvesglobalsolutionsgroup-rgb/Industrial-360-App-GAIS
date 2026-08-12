import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, collectionGroup, limit, startAfter, orderBy,
  QueryConstraint, QueryDocumentSnapshot, DocumentSnapshot, DocumentData
} from 'firebase/firestore';
import { z } from 'zod';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { BaseEntity } from './types';
import { guardFirestoreWrite, QuotaExceededError } from '../finops/platformMetricsEngine';
import { repositorySchemasMap } from '../domain/entitySchemas';

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData> | null;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  additionalFilters?: QueryConstraint[];
}

export interface PaginatedResult<T> {
  items: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export class BaseRepository<T extends BaseEntity> {
  constructor(
    public readonly collectionName: string,
    public readonly schema?: z.ZodSchema<any>
  ) {}

  /**
   * Valida runtime los datos usando el esquema Zod del repositorio o del registro global.
   */
  public validateData(data: unknown, isUpdate = false): void {
    const schemaToUse = this.schema || repositorySchemasMap[this.collectionName];
    if (!schemaToUse) return;

    const schemaToApply = isUpdate && 'partial' in schemaToUse && typeof (schemaToUse as any).partial === 'function'
      ? (schemaToUse as any).partial()
      : schemaToUse;

    const result = schemaToApply.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues;
      const formatted = issues
        .map((i: any) => `${i.path.join('.') || 'payload'}: ${i.message}`)
        .join('; ');
      const err = new Error(
        `[ZodValidationError] Fallo de validación al ${isUpdate ? 'actualizar' : 'crear'} en '${this.collectionName}': ${formatted}`
      );
      (err as any).zodIssues = issues;
      (err as any).name = 'ZodValidationError';
      throw err;
    }
  }

  private getCollectionPath(orgId: string, projectId: string): string {
    return `organizations/${orgId}/projects/${projectId}/${this.collectionName}`;
  }

  async getAll(orgId: string, projectId: string, maxLimit = 50): Promise<T[]> {
    if (!orgId || !projectId) throw new Error('orgId y projectId son obligatorios.');
    const safeLimit = Math.min(Math.max(maxLimit, 1), 50);
    try {
      const snap = projectId === 'all'
        ? await getDocs(query(collectionGroup(db, this.collectionName), where('orgId', '==', orgId), limit(safeLimit)))
        : await getDocs(query(collection(db, this.getCollectionPath(orgId, projectId)), limit(safeLimit)));
      
      const map = new Map<string, T>();
      snap.docs.forEach(d => {
        if (!map.has(d.id)) {
          map.set(d.id, { id: d.id, ...d.data() } as T);
        }
      });
      return Array.from(map.values());
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, this.collectionName);
      return [];
    }
  }

  async getPaginated(
    orgId: string,
    projectId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    if (!orgId || !projectId) throw new Error('orgId y projectId son obligatorios.');

    const pageSize = Math.min(Math.max(options.pageSize || 20, 1), 50);
    const orderField = options.orderByField || 'createdAt';
    const orderDir = options.orderDirection || 'desc';

    const constraints: QueryConstraint[] = [];

    if (projectId === 'all') {
      constraints.push(where('orgId', '==', orgId));
    }

    if (options.additionalFilters && options.additionalFilters.length > 0) {
      constraints.push(...options.additionalFilters);
    }

    constraints.push(orderBy(orderField, orderDir));

    if (options.lastDoc) {
      constraints.push(startAfter(options.lastDoc));
    }

    constraints.push(limit(pageSize));

    try {
      const q = projectId === 'all'
        ? query(collectionGroup(db, this.collectionName), ...constraints)
        : query(collection(db, this.getCollectionPath(orgId, projectId)), ...constraints);

      const snap = await getDocs(q);
      const items: T[] = [];
      snap.docs.forEach(d => {
        items.push({ id: d.id, ...d.data() } as T);
      });

      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      const hasMore = snap.docs.length === pageSize;

      return { items, lastDoc, hasMore };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, this.collectionName);
      return { items: [], lastDoc: null, hasMore: false };
    }
  }

  async getById(orgId: string, projectId: string, id: string): Promise<T | null> {
    if (!orgId || !projectId || !id) throw new Error('orgId, projectId e id son obligatorios.');
    const targetProjectId = projectId === 'all' ? 'PROJ-CARDON-AMUAY' : projectId;
    try {
      const snap = await getDoc(doc(db, this.getCollectionPath(orgId, targetProjectId), id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as T;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${this.collectionName}/${id}`);
      return null;
    }
  }

  /**
   * Hook de integración FinOps para verificación y reserva de cuota de escritura.
   */
  public async checkQuotaBeforeWrite(orgId: string, count: number = 1): Promise<void> {
    try {
      guardFirestoreWrite(orgId, count);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        throw err;
      }
    }
  }

  async create(
    orgId: string, 
    projectId: string, 
    data: Omit<T, 'id' | 'orgId' | 'projectId' | 'createdAt' | 'updatedAt'> & Partial<BaseEntity>
  ): Promise<T> {
    if (!orgId || !projectId) throw new Error('orgId y projectId son obligatorios.');
    
    // Validación de esquema Zod en el punto de escritura
    this.validateData(data, false);

    await this.checkQuotaBeforeWrite(orgId, 1);

    let targetProjectId = projectId;
    if (targetProjectId === 'all') {
      targetProjectId = (data as any).projectId && (data as any).projectId !== 'all'
        ? (data as any).projectId
        : 'PROJ-CARDON-AMUAY';
    }
    
    const now = new Date().toISOString();
    const payload = {
      ...data,
      orgId,
      projectId: targetProjectId,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    try {
      const ref = await addDoc(collection(db, this.getCollectionPath(orgId, targetProjectId)), payload);
      return { id: ref.id, ...payload } as T;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, this.collectionName);
      throw err;
    }
  }

  async update(orgId: string, projectId: string, id: string, updates: Partial<T>): Promise<void> {
    if (!orgId || !projectId || !id) throw new Error('orgId, projectId e id son obligatorios.');
    
    // Validación de esquema Zod en el punto de escritura (parcial para actualizaciones)
    this.validateData(updates, true);

    let targetProjectId = projectId;
    if (targetProjectId === 'all') {
      targetProjectId = (updates as any).projectId && (updates as any).projectId !== 'all'
        ? (updates as any).projectId
        : 'PROJ-CARDON-AMUAY';
    }

    try {
      const docRef = doc(db, this.getCollectionPath(orgId, targetProjectId), id);
      await updateDoc(docRef, {
        ...updates,
        orgId,
        projectId: targetProjectId,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${this.collectionName}/${id}`);
      throw err;
    }
  }

  async delete(orgId: string, projectId: string, id: string): Promise<void> {
    if (!orgId || !projectId || !id) throw new Error('orgId, projectId e id son obligatorios.');
    const targetProjectId = projectId === 'all' ? 'PROJ-CARDON-AMUAY' : projectId;
    try {
      await deleteDoc(doc(db, this.getCollectionPath(orgId, targetProjectId), id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${this.collectionName}/${id}`);
      throw err;
    }
  }

  subscribe(
    orgId: string, 
    projectId: string, 
    callback: (items: T[]) => void, 
    onError?: (err: any) => void,
    options?: { limitCount?: number }
  ): () => void {
    if (!orgId || !projectId) {
      console.warn('subscribe invocado sin orgId o projectId');
      callback([]);
      return () => {};
    }

    const safeLimit = Math.min(Math.max(options?.limitCount || 50, 1), 50);

    const q = projectId === 'all'
      ? query(collectionGroup(db, this.collectionName), where('orgId', '==', orgId), limit(safeLimit))
      : query(collection(db, this.getCollectionPath(orgId, projectId)), limit(safeLimit));

    return onSnapshot(q, (snap) => {
      const map = new Map<string, T>();
      snap.docs.forEach(d => {
        if (!map.has(d.id)) {
          map.set(d.id, { id: d.id, ...d.data() } as T);
        }
      });
      callback(Array.from(map.values()));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, this.collectionName);
      if (onError) onError(err);
    });
  }
}
