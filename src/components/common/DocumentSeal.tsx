import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, Lock, ExternalLink, AlertTriangle } from 'lucide-react';
import { buildMinimalQrVerificationUrl, FrozenDocumentMetadata } from '../../lib/documentPolicy';

interface DocumentSealProps {
  sha256Hash: string;
  docId: string;
  sealedAt?: string;
  sealedBy?: string;
  status?: 'VALIDEZ_OFICIAL' | 'BORRADOR' | 'REVOCADO';
  metadata?: FrozenDocumentMetadata;
  verifierBaseUrl?: string;
}

export const DocumentSeal: React.FC<DocumentSealProps> = ({
  sha256Hash,
  docId,
  sealedAt,
  sealedBy,
  status = 'VALIDEZ_OFICIAL',
  metadata,
  verifierBaseUrl,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const targetVerificationUrl = buildMinimalQrVerificationUrl(docId, sha256Hash, verifierBaseUrl || metadata?.verifierBaseUrl);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(targetVerificationUrl, {
      margin: 1,
      width: 120,
      color: {
        dark: '#0B2239',
        light: '#FFFFFF',
      },
    })
      .then(url => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Error generando QR de sello:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [targetVerificationUrl]);

  const shortHash = sha256Hash ? `${sha256Hash.substring(0, 12)}...${sha256Hash.substring(sha256Hash.length - 8)}` : 'N/A';

  return (
    <div className="w-full bg-surface border border-surface-border rounded-xl p-4 shadow-sm my-4 font-sans text-xs text-ink">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Seal Identity & Status */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-500 flex items-center justify-center">
            {status === 'VALIDEZ_OFICIAL' ? (
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            ) : (
              <Lock className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider text-ink">SELLO DIGITAL CRIPTOGRÁFICO</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                status === 'VALIDEZ_OFICIAL'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
              }`}>
                {status}
              </span>
            </div>

            <div className="mt-1 space-y-0.5 font-mono text-[11px] text-ink-muted">
              <div>
                <span className="text-ink-faint">SHA-256: </span>
                <span className="font-semibold text-ink select-all">{shortHash}</span>
              </div>
              {sealedAt && (
                <div>
                  <span className="text-ink-faint">TIMESTAMP: </span>
                  <span>{sealedAt} ({metadata?.timezone || 'America/Caracas'})</span>
                </div>
              )}
              {metadata && (
                <div className="text-[10px] text-ink-faint flex items-center gap-2 mt-0.5 font-sans">
                  <span>Plantilla: {metadata.templateVersion}</span>
                  <span>•</span>
                  <span>BrandKit: {metadata.brandKitVersion}</span>
                  <span>•</span>
                  <span>Sello: {metadata.sealVersion}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right QR Code & Verifier link */}
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-surface-border pt-3 sm:pt-0 sm:pl-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Verificación" className="w-16 h-16 rounded border border-surface-border shadow-xs" />
          ) : (
            <div className="w-16 h-16 rounded border border-surface-border bg-surface-subtle flex items-center justify-center text-[10px] text-ink-faint">
              Cargando QR
            </div>
          )}
          <div className="text-[10px] space-y-1 max-w-[180px]">
            <p className="font-bold text-ink uppercase tracking-tight">Verificación Pública</p>
            <p className="text-ink-faint text-[9.5px]">Escanee el QR para validar autenticidad sin exponer PII ni datos internos.</p>
            <a
              href={targetVerificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-500 hover:underline font-semibold"
            >
              <span>Verificar en línea</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
