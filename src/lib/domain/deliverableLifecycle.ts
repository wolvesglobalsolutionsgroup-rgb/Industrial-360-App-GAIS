import { MasterDeliverable, DeliverableLifecycleStatus, DeliverableDigitalSignature } from './types';
import { calculateVisualVersionHash, generateQrVerificationUrl } from '../audit/deliverableHash';
import { renderMasterDeliverableHtml } from '../renderers/masterDeliverableRenderer';

export class DeliverableArchivedError extends Error {
  constructor(public deliverableId: string) {
    super(`Acceso denegado: El entregable '${deliverableId}' se encuentra en estado CLOSED_ARCHIVED y es estrictamente inmutable.`);
    this.name = 'DeliverableArchivedError';
  }
}

export class InvalidStateTransitionError extends Error {
  constructor(public currentStatus: string, public targetStatus: string) {
    super(`Transición no permitida: No se puede cambiar de '${currentStatus}' a '${targetStatus}'.`);
    this.name = 'InvalidStateTransitionError';
  }
}

export const ALLOWED_DELIVERABLE_TRANSITIONS: Record<DeliverableLifecycleStatus, DeliverableLifecycleStatus[]> = {
  DRAFT: ['FOR_REVIEW', 'CLOSED_ARCHIVED'],
  FOR_REVIEW: ['APPROVED_VIGENTE', 'DRAFT'],
  APPROVED_VIGENTE: ['ISSUED_ACTIVE', 'FOR_REVIEW'],
  ISSUED_ACTIVE: ['CLOSED_ARCHIVED'],
  CLOSED_ARCHIVED: [], // Sin salidas: Estado final e inmutable
};

/**
 * Valida si una transición de estado es válida según la máquina de estados.
 */
export function canTransitionDeliverableState(
  currentStatus: DeliverableLifecycleStatus,
  targetStatus: DeliverableLifecycleStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_DELIVERABLE_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Aplica una transición de estado en un entregable maestro.
 * Garantiza inmutabilidad en CLOSED_ARCHIVED y recalcula el hash visual en aprobación o emisión.
 */
export function transitionDeliverable(
  deliverable: MasterDeliverable,
  targetStatus: DeliverableLifecycleStatus,
  actor: { uid: string; name: string; role: string; motive?: string }
): MasterDeliverable {
  // Guardia de inmutabilidad: Si ya está en CLOSED_ARCHIVED, no se puede modificar.
  if (deliverable.header.estatus === 'CLOSED_ARCHIVED') {
    throw new DeliverableArchivedError(deliverable.id);
  }

  if (!canTransitionDeliverableState(deliverable.header.estatus, targetStatus)) {
    throw new InvalidStateTransitionError(deliverable.header.estatus, targetStatus);
  }

  const nowIso = new Date().toISOString();
  const updatedHeader = {
    ...deliverable.header,
    estatus: targetStatus,
  };

  const updatedSignatures: DeliverableDigitalSignature[] = [
    ...(deliverable.footer.firmasDigitales || []),
  ];

  if (actor) {
    updatedSignatures.push({
      signerUid: actor.uid,
      signerName: actor.name,
      signerRole: actor.role,
      signedAt: nowIso,
      motive: actor.motive || `Cambio de estado a ${targetStatus}`,
    });
  }

  const archivedAt = targetStatus === 'CLOSED_ARCHIVED' ? nowIso : deliverable.footer.archivedAt;

  // Renderizar plantilla previa y recalcular visualVersionHash
  const tempDeliverable: MasterDeliverable = {
    ...deliverable,
    header: updatedHeader,
    footer: {
      ...deliverable.footer,
      firmasDigitales: updatedSignatures,
      archivedAt,
    },
    updatedAt: nowIso,
  };

  const templateHtml = renderMasterDeliverableHtml(tempDeliverable);
  const visualVersionHash = calculateVisualVersionHash(
    { header: updatedHeader, body: deliverable.body },
    templateHtml
  );

  const qrVerificationUrl = generateQrVerificationUrl(visualVersionHash);

  const finalFooter = {
    firmasDigitales: updatedSignatures,
    visualVersionHash,
    qrVerificationUrl,
    archivedAt,
  };

  return {
    ...deliverable,
    header: updatedHeader,
    footer: finalFooter,
    updatedAt: nowIso,
  };
}

/**
 * Crea una nueva revisión a partir de un entregable en estado CLOSED_ARCHIVED.
 * Incrementa el número de revisión (e.g. "0" -> "1" o "Rev. 0" -> "Rev. 1").
 */
export function createNewRevisionFromArchived(
  archivedDeliverable: MasterDeliverable,
  actor: { uid: string; name: string; role: string },
  newTitle?: string
): MasterDeliverable {
  const currentRev = archivedDeliverable.header.revision || '0';
  const revNum = parseInt(currentRev.replace(/\D/g, ''), 10);
  const nextRev = isNaN(revNum) ? `${currentRev}.1` : `${revNum + 1}`;

  const nowIso = new Date().toISOString();
  const newId = `DEL-${archivedDeliverable.workflowId}-${Date.now().toString(36)}`;

  const newHeader = {
    ...archivedDeliverable.header,
    titulo: newTitle || archivedDeliverable.header.titulo,
    revision: nextRev,
    fecha: nowIso.split('T')[0],
    estatus: 'DRAFT' as DeliverableLifecycleStatus,
  };

  const newBody = {
    ...archivedDeliverable.body,
    datosOrigen: {
      ...(archivedDeliverable.body.datosOrigen || {}),
      previousRevisionId: archivedDeliverable.id,
      previousRevisionNumber: currentRev,
      revisionCreatedBy: actor.uid,
      revisionCreatedAt: nowIso,
    },
  };

  const newFooter = {
    firmasDigitales: [
      {
        signerUid: actor.uid,
        signerName: actor.name,
        signerRole: actor.role,
        signedAt: nowIso,
        motive: `Inicio de nueva revisión ${nextRev} basada en ${archivedDeliverable.id}`,
      },
    ],
    visualVersionHash: '',
    qrVerificationUrl: '',
    archivedAt: undefined,
  };

  const draftDeliverable: MasterDeliverable = {
    id: newId,
    workflowId: archivedDeliverable.workflowId,
    header: newHeader,
    body: newBody,
    footer: newFooter,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const templateHtml = renderMasterDeliverableHtml(draftDeliverable);
  const hash = calculateVisualVersionHash(
    { header: newHeader, body: newBody },
    templateHtml
  );

  return {
    ...draftDeliverable,
    footer: {
      ...newFooter,
      visualVersionHash: hash,
      qrVerificationUrl: generateQrVerificationUrl(hash),
    },
  };
}
