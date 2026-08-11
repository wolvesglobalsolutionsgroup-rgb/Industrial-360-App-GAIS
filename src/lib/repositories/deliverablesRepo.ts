import { doc, getDoc, setDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { MasterDeliverable } from '../domain/types';
import { MasterDeliverableSchema } from '../domain/schemas';
import { calculateVisualVersionHash, generateQrVerificationUrl } from '../audit/deliverableHash';
import { renderMasterDeliverableHtml } from '../renderers/masterDeliverableRenderer';
import { DeliverableArchivedError } from '../domain/deliverableLifecycle';
import { guardFirestoreWrite } from '../finops/platformMetricsEngine';

export class DeliverablesRepository {
  private getCollectionPath(tenantId: string, projectId: string): string {
    return `organizations/${tenantId}/projects/${projectId}/deliverables`;
  }

  /**
   * Guarda o actualiza un entregable maestro con validación de esquema,
   * cálculo de hash visual inmutable y protección contra modificación si está archivado.
   */
  async saveDeliverable(deliverable: MasterDeliverable, actorUid: string = 'system'): Promise<MasterDeliverable> {
    // 1. Validar esquema Zod
    const validated = MasterDeliverableSchema.parse(deliverable) as MasterDeliverable;

    const tenantId = validated.header.tenantId;
    const projectId = validated.header.workPackageId || 'default-project';

    // 2. Verificar si existe y si está archivado (Guardia de inmutabilidad)
    const docRef = doc(db, this.getCollectionPath(tenantId, projectId), validated.id);
    const existingSnap = await getDoc(docRef);

    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as MasterDeliverable;
      if (existingData.header?.estatus === 'CLOSED_ARCHIVED') {
        throw new DeliverableArchivedError(validated.id);
      }
    }

    // 3. Garantizar/Recalcular visualVersionHash
    let visualHash = validated.footer.visualVersionHash;
    const htmlTemplate = renderMasterDeliverableHtml(validated);
    
    if (!visualHash || visualHash.trim() === '') {
      visualHash = calculateVisualVersionHash(
        { header: validated.header, body: validated.body },
        htmlTemplate
      );
    }

    const qrUrl = generateQrVerificationUrl(visualHash);

    const deliverableToSave: MasterDeliverable = {
      ...validated,
      footer: {
        ...validated.footer,
        visualVersionHash: visualHash,
        qrVerificationUrl: qrUrl,
      },
      updatedAt: new Date().toISOString(),
    };

    // 4. Guardar en Firestore con FinOps Metrics Guard
    try {
      await guardFirestoreWrite(tenantId, 1);
      await setDoc(docRef, deliverableToSave, { merge: true });

      // Mirror a la colección global de verificaciones inmutables por QR
      const verificationRef = doc(db, 'document_verifications', visualHash);
      await setDoc(verificationRef, {
        sha256: visualHash,
        docId: deliverableToSave.id,
        workflowId: deliverableToSave.workflowId,
        status: deliverableToSave.header.estatus,
        version: `REV-${deliverableToSave.header.revision}`,
        issuedAt: deliverableToSave.updatedAt,
        verificationUrl: qrUrl,
        metadata: {
          proyecto: deliverableToSave.header.proyecto,
          titulo: deliverableToSave.header.titulo,
          codigoDocumento: deliverableToSave.header.codigoDocumento,
          tenantId: deliverableToSave.header.tenantId,
          operadorNombre: deliverableToSave.header.operadorNombre,
          contratistaNombre: deliverableToSave.header.contratistaNombre,
        },
        updatedAt: new Date().toISOString(),
        updatedBy: actorUid,
      }, { merge: true });

      return deliverableToSave;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'deliverables');
      throw err;
    }
  }

  /**
   * Obtiene un entregable por ID con filtro multi-tenant.
   */
  async getDeliverableById(tenantId: string, projectId: string, deliverableId: string): Promise<MasterDeliverable | null> {
    if (!tenantId || !deliverableId) return null;
    try {
      const docRef = doc(db, this.getCollectionPath(tenantId, projectId), deliverableId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as MasterDeliverable;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'deliverables');
      return null;
    }
  }

  /**
   * Obtiene la lista de entregables filtrados por tenantId y workflow.
   */
  async getDeliverablesByTenant(tenantId: string, projectId: string, workflowId?: string): Promise<MasterDeliverable[]> {
    if (!tenantId) return [];
    try {
      const collRef = collection(db, this.getCollectionPath(tenantId, projectId));
      const constraints = [];
      if (workflowId) {
        constraints.push(where('workflowId', '==', workflowId));
      }
      constraints.push(limit(50));

      const q = query(collRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as MasterDeliverable);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'deliverables');
      return [];
    }
  }
}

export const deliverablesRepo = new DeliverablesRepository();
