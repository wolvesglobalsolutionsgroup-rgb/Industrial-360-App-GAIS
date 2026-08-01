import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase-admin/firestore', () => {
  const getDocMock = vi.fn();
  const docMock = vi.fn(() => ({
    get: getDocMock,
  }));

  return {
    getFirestore: () => ({
      doc: docMock,
    }),
    FieldPath: {
      documentId: vi.fn(() => '__name__'),
    },
  };
});

import { authorizeServerSideRequest } from '../authorizer';
import { getFirestore } from 'firebase-admin/firestore';

describe('Server-Side Authorizer (authorizeServerSideRequest)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Rechaza usuarios no autenticados', async () => {
    await expect(
      authorizeServerSideRequest(undefined, { orgId: 'orgA' })
    ).rejects.toThrow('Se requiere un usuario autenticado');
  });

  it('2. Rechaza cuando falta orgId o está vacío', async () => {
    const authContext: any = { uid: 'usr_1', token: { role: 'gerente', orgId: 'orgA' } };

    await expect(
      authorizeServerSideRequest(authContext, { orgId: '' })
    ).rejects.toThrow('orgId es obligatorio');
  });

  it('3. Rechaza cuando projectId es requerido pero no fue suministrado', async () => {
    const authContext: any = { uid: 'usr_1', token: { role: 'gerente', orgId: 'orgA' } };

    await expect(
      authorizeServerSideRequest(authContext, { orgId: 'orgA', requireProject: true, projectId: '' })
    ).rejects.toThrow('projectId es obligatorio');
  });

  it('4. Rechaza inconsistencias entre el claim orgId del usuario y la org solicitada (Org A vs Org B)', async () => {
    const authContext: any = { uid: 'usr_orgA', token: { role: 'gerente', orgId: 'orgA' } };

    await expect(
      authorizeServerSideRequest(authContext, { orgId: 'orgB' })
    ).rejects.toThrow("El usuario pertenece a la organización 'orgA', pero solicitó operar en 'orgB'");
  });

  it('5. Rechaza inconsistencias entre la ruta HTTP y el cuerpo de la petición', async () => {
    const authContext: any = { uid: 'usr_1', token: { role: 'gerente', orgId: 'orgA' } };

    await expect(
      authorizeServerSideRequest(authContext, {
        orgId: 'orgA',
        routeOrgId: 'orgB',
      })
    ).rejects.toThrow("Inconsistencia de seguridad: orgId en ruta ('orgB') no coincide");
  });

  it('6. Rechaza a usuarios sin registro de membresía en /organizations/{orgId}/memberships/{uid}', async () => {
    const authContext: any = { uid: 'usr_no_membership', token: { role: 'gerente', orgId: 'orgA' } };
    const dbMock = getFirestore() as any;

    // Membership doc not found
    dbMock.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({ exists: false }),
    });

    await expect(
      authorizeServerSideRequest(authContext, { orgId: 'orgA' })
    ).rejects.toThrow("El usuario 'usr_no_membership' no posee registro de membresía");
  });

  it('7. Rechaza a usuarios con membresía inactiva o suspendida', async () => {
    const authContext: any = { uid: 'usr_suspended', token: { role: 'gerente', orgId: 'orgA' } };
    const dbMock = getFirestore() as any;

    dbMock.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ status: 'suspended', role: 'gerente', orgId: 'orgA' }),
      }),
    });

    await expect(
      authorizeServerSideRequest(authContext, { orgId: 'orgA' })
    ).rejects.toThrow("El estado de su membresía en 'orgA' es 'suspended'");
  });

  it('8. Rechaza intentos de escalación de privilegios cuando el rol no está en allowedRoles', async () => {
    const authContext: any = { uid: 'usr_campo', token: { role: 'campo', orgId: 'orgA' } };
    const dbMock = getFirestore() as any;

    dbMock.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ status: 'approved', role: 'campo', orgId: 'orgA' }),
      }),
    });

    await expect(
      authorizeServerSideRequest(authContext, {
        orgId: 'orgA',
        allowedRoles: ['gerente', 'superadmin'],
      })
    ).rejects.toThrow("El rol 'campo' no está autorizado para esta operación");
  });

  it('9. Rechaza la petición si el proyecto no existe bajo la organización', async () => {
    const authContext: any = { uid: 'usr_valid', token: { role: 'gerente', orgId: 'orgA' } };
    const dbMock = getFirestore() as any;

    // Membership exists
    dbMock.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ status: 'approved', role: 'gerente', orgId: 'orgA' }),
      }),
    });

    // Project doc does not exist
    dbMock.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({ exists: false }),
    });

    await expect(
      authorizeServerSideRequest(authContext, {
        orgId: 'orgA',
        projectId: 'proj_nonexistent',
      })
    ).rejects.toThrow("El proyecto 'proj_nonexistent' no existe o no pertenece a la organización 'orgA'");
  });

  it('10. Autoriza exitosamente a un usuario con membresía activa y permisos adecuados', async () => {
    const authContext: any = { uid: 'usr_gerente', token: { role: 'gerente', orgId: 'orgA' } };
    const dbMock = getFirestore() as any;

    // Membership doc
    dbMock.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ status: 'active', role: 'gerente', orgId: 'orgA' }),
      }),
    });

    // Project doc
    dbMock.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ id: 'proj_1', orgId: 'orgA' }),
      }),
    });

    const res = await authorizeServerSideRequest(authContext, {
      orgId: 'orgA',
      projectId: 'proj_1',
      allowedRoles: ['gerente', 'superadmin'],
    });

    expect(res.uid).toBe('usr_gerente');
    expect(res.orgId).toBe('orgA');
    expect(res.projectId).toBe('proj_1');
    expect(res.role).toBe('gerente');
  });

  it('11. Rechaza a usuario que aduce claim superadmin pero NO posee membership en la org objetivo', async () => {
    const authContext: any = { uid: 'usr_fake_superadmin', token: { role: 'superadmin', orgId: 'orgA' } };
    const dbMock = getFirestore() as any;

    // Membership doc does not exist
    dbMock.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({ exists: false }),
    });

    await expect(
      authorizeServerSideRequest(authContext, { orgId: 'orgA' })
    ).rejects.toThrow("El usuario 'usr_fake_superadmin' no posee registro de membresía");
  });

  it('12. Rechaza si la membresía de tenant intenta otorgar platformAdmin', async () => {
    const authContext: any = { uid: 'usr_platform_attempt', token: { role: 'campo', orgId: 'orgA' } };
    const dbMock = getFirestore() as any;

    dbMock.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ status: 'active', role: 'platformAdmin', orgId: 'orgA' }),
      }),
    });

    await expect(
      authorizeServerSideRequest(authContext, { orgId: 'orgA' })
    ).rejects.toThrow("El rol 'platformAdmin' no puede ser concedido por una membresía de organización");
  });
});
