import React from 'react';
import { CheckCircle2, Clock, XCircle, UserCheck, Shield } from 'lucide-react';
import { DocumentSignerItem } from '../../lib/documentPolicy';

interface DocumentSignerProps {
  signers: DocumentSignerItem[];
  onSignDocument?: (signerId: string) => void;
  canUserSign?: boolean;
  currentUserId?: string;
  readOnly?: boolean;
}

export const DocumentSigner: React.FC<DocumentSignerProps> = ({
  signers,
  onSignDocument,
  canUserSign = false,
  currentUserId,
  readOnly = false,
}) => {
  return (
    <div className="w-full bg-surface border border-surface-border rounded-xl p-4 shadow-sm my-4 font-sans text-xs">
      <div className="flex items-center justify-between border-b border-surface-border pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-500" />
          <h3 className="font-extrabold text-ink uppercase tracking-wider text-xs">FIRMAS Y CONFORMIDAD DOCUMENTAL (1:N)</h3>
        </div>
        <span className="text-[11px] font-semibold text-ink-muted">
          {signers.filter(s => s.status === 'SIGNED').length} de {signers.length} Firmado(s)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {signers.map(signer => {
          const isSigned = signer.status === 'SIGNED';
          const isRejected = signer.status === 'REJECTED';

          return (
            <div
              key={signer.id}
              className={`rounded-lg border p-3 flex flex-col justify-between transition-colors ${
                isSigned
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : isRejected
                  ? 'bg-rose-500/5 border-rose-500/30'
                  : 'bg-surface-subtle border-surface-border'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                    {signer.role} • {signer.organization}
                  </span>
                  <div className="flex items-center gap-1">
                    {isSigned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        FIRMADO
                      </span>
                    )}
                    {isRejected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        <XCircle className="w-3 h-3" />
                        RECHAZADO
                      </span>
                    )}
                    {!isSigned && !isRejected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        PENDIENTE
                      </span>
                    )}
                  </div>
                </div>

                <p className="font-bold text-ink text-sm leading-tight mt-1">{signer.name}</p>
                <p className="text-[11px] text-ink-muted">{signer.title}</p>

                {isSigned && signer.signedAt && (
                  <div className="mt-2 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                    <div>FIRMADO: {signer.signedAt}</div>
                    {signer.signatureHash && (
                      <div className="truncate text-[9px] text-emerald-800 dark:text-emerald-300">
                        HASH: {signer.signatureHash.substring(0, 16)}...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isSigned && !readOnly && canUserSign && onSignDocument && (
                <button
                  type="button"
                  onClick={() => onSignDocument(signer.id)}
                  className="mt-3 w-full py-1.5 px-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>EFECTUAR FIRMA DIGITAL</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
