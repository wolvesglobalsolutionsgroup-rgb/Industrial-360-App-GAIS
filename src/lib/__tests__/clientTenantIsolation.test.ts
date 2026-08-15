import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import { BaseRepository } from '../repositories/baseRepo';

// Mock Firebase firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<any>('firebase/firestore');
  return {
    ...actual,
    addDoc: vi.fn().mockResolvedValue({ id: 'mocked-doc-id' }),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    getDoc: vi.fn().mockResolvedValue({ exists: () => true, id: 'mocked-doc-id', data: () => ({ name: 'Test' }) }),
    getDocs: vi.fn().mockResolvedValue({
      docs: [
        { id: 'doc-1', data: () => ({ name: 'Doc 1', orgId: 'ORG-01' }) },
        { id: 'doc-2', data: () => ({ name: 'Doc 2', orgId: 'ORG-01' }) },
      ]
    }),
    doc: vi.fn().mockReturnValue({ id: 'mocked-doc-ref' }),
    collection: vi.fn().mockReturnValue({ id: 'mocked-collection-ref' }),
    collectionGroup: vi.fn().mockReturnValue({ id: 'mocked-group-ref' }),
    query: vi.fn().mockReturnValue({ id: 'mocked-query-ref' }),
    where: vi.fn(),
    limit: vi.fn(),
  };
});

describe('Sprint F-MT-FIX — Strict Client Multi-Tenancy & BaseRepository Isolation', () => {
  class TestRepo extends BaseRepository<{ id: string; name: string; orgId: string; projectId: string }> {
    constructor() {
      super('test_entities');
    }
  }

  const repo = new TestRepo();
  const orgId = 'ORG-TEST-100';

  it('1. getById lanza error explícito cuando projectId === "all"', async () => {
    await expect(
      repo.getById(orgId, 'all', 'entity-123')
    ).rejects.toThrow(/projectId "all" no es resoluble en getById/i);
  });

  it('2. create lanza error explícito cuando projectId === "all"', async () => {
    await expect(
      repo.create(orgId, 'all', { name: 'Item Test' } as any)
    ).rejects.toThrow(/projectId "all" no es resoluble en create/i);
  });

  it('3. update lanza error explícito cuando projectId === "all"', async () => {
    await expect(
      repo.update(orgId, 'all', 'entity-123', { name: 'Updated Item' })
    ).rejects.toThrow(/projectId "all" no es resoluble en update/i);
  });

  it('4. delete lanza error explícito cuando projectId === "all"', async () => {
    await expect(
      repo.delete(orgId, 'all', 'entity-123')
    ).rejects.toThrow(/projectId "all" no es resoluble en delete/i);
  });

  it('5. getAllAcrossProjects ejecuta consulta deliberada por collectionGroup con orgId', async () => {
    const results = await repo.getAllAcrossProjects(orgId, 25);
    expect(results).toBeDefined();
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('doc-1');
  });

  it('6. getById con projectId válido ejecuta correctamente', async () => {
    const result = await repo.getById(orgId, 'PROJ-VALID-01', 'entity-123');
    expect(result).toBeDefined();
    expect(result?.id).toBe('mocked-doc-id');
  });
});
