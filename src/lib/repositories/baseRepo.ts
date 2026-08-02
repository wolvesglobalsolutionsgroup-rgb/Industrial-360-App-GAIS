import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, collectionGroup 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { BaseEntity } from './types';

export class BaseRepository<T extends BaseEntity> {
  constructor(public readonly collectionName: string) {}

  private getCollectionPath(orgId: string, projectId: string): string {
    return `organizations/${orgId}/projects/${projectId}/${this.collectionName}`;
  }

  async getAll(orgId: string, projectId: string): Promise<T[]> {
    if (!orgId || !projectId) throw new Error('orgId y projectId son obligatorios.');
    try {
      const snap = projectId === 'all'
        ? await getDocs(query(collectionGroup(db, this.collectionName), where('orgId', '==', orgId)))
        : await getDocs(collection(db, this.getCollectionPath(orgId, projectId)));
      
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

  async create(
    orgId: string, 
    projectId: string, 
    data: Omit<T, 'id' | 'orgId' | 'projectId' | 'createdAt' | 'updatedAt'> & Partial<BaseEntity>
  ): Promise<T> {
    if (!orgId || !projectId) throw new Error('orgId y projectId son obligatorios.');
    
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

  subscribe(orgId: string, projectId: string, callback: (items: T[]) => void, onError?: (err: any) => void): () => void {
    if (!orgId || !projectId) {
      console.warn('subscribe invocado sin orgId o projectId');
      callback([]);
      return () => {};
    }

    const q = projectId === 'all'
      ? query(collectionGroup(db, this.collectionName), where('orgId', '==', orgId))
      : query(collection(db, this.getCollectionPath(orgId, projectId)));

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
