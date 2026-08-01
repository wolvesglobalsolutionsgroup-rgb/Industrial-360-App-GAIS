import { describe, it, expect } from 'vitest';
import { OPERATOR_BRAND_PRESETS, getOperatorPreset } from '../../brandKitPresets';
import { 
  freezeDocumentMetadata, 
  buildMinimalQrVerificationUrl, 
  computeBrowserSha256,
  formatDocumentDateTime,
  DocumentSignerItem
} from '../../documentPolicy';
import { BrandKit } from '../../../ProjectContext';

describe('S18 — BrandKit Multi-Operador, Doble Membrete y Sello Seguro', () => {

  describe('1. Presets de Operadores (PDVSA, Chevron, Repsol, ENI)', () => {
    it('debe contener los 4 presets de operadores en estado DRAFT sin afirmar certificación', () => {
      const operators = ['PDVSA', 'CHEVRON', 'REPSOL', 'ENI'] as const;

      for (const opKey of operators) {
        const preset = OPERATOR_BRAND_PRESETS[opKey];
        expect(preset).toBeDefined();
        expect(preset.presetKey).toBe(opKey);
        expect(preset.status).toBe('DRAFT'); // Preset borrador obligatorio
        expect(preset.disclaimer.toLowerCase()).toMatch(/borrador|draft/);
        expect(preset.logoUrl).toBe(''); // No logos sin autorización
      }
    });

    it('getOperatorPreset debe generar un preset tenant-scoped en modo DRAFT', () => {
      const tenantPreset = getOperatorPreset('PDVSA', 'prointeca-demo');
      expect(tenantPreset.companyName).toContain('[Tenant: prointeca-demo]');
      expect(tenantPreset.status).toBe('DRAFT');
    });
  });

  describe('2. Congelamiento Inmutable de Documento (freezeDocumentMetadata)', () => {
    it('debe congelar todas las versiones de plantilla, brandKit, documento y sello', () => {
      const mockSigners: DocumentSignerItem[] = [
        {
          id: 'sig-1',
          name: 'Ing. Carlos Pérez',
          title: 'Residente de Obra',
          role: 'CONTRACTOR',
          organization: 'PROINTECA C.A.',
          status: 'SIGNED',
          signedAt: '2026-08-01T12:00:00Z',
          signatureHash: 'a1b2c3d4e5f67890'
        }
      ];

      const sampleBrand: Partial<BrandKit> = {
        companyName: 'PROINTECA INDUSTRIAL',
        primaryColor: '#0B2239'
      };

      const frozen = freezeDocumentMetadata(mockSigners, {
        templateVersion: '2026.1',
        brandKitVersion: 'v1.0',
        documentVersion: 'REV-1',
        sealVersion: 'v1.0',
        locale: 'es-VE',
        timezone: 'America/Caracas'
      }, sampleBrand, 'PDVSA');

      expect(frozen.templateVersion).toBe('2026.1');
      expect(frozen.brandKitVersion).toBe('v1.0');
      expect(frozen.documentVersion).toBe('REV-1');
      expect(frozen.sealVersion).toBe('v1.0');
      expect(frozen.locale).toBe('es-VE');
      expect(frozen.timezone).toBe('America/Caracas');
      expect(frozen.operatorPreset).toBe('PDVSA');
      expect(frozen.signers).toHaveLength(1);
      expect(frozen.signers[0].name).toBe('Ing. Carlos Pérez');
    });
  });

  describe('3. Formato de Fecha/Hora Documental por Zona (America/Caracas)', () => {
    it('debe formatear la fecha/hora correctamente respetando la política de timezone', () => {
      const isoString = '2026-08-01T18:30:00.000Z';
      const formatted = formatDocumentDateTime(isoString, 'America/Caracas', 'es-VE');
      expect(formatted).toBeDefined();
      expect(formatted).not.toBe('Fecha No Válida');
    });
  });

  describe('4. Sello y QR de Verificación Pública (Minimal QR)', () => {
    it('buildMinimalQrVerificationUrl no debe filtrar datos PII ni rutas internas', () => {
      const docId = 'PTS-PROINTECA-2026-001';
      const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const qrUrl = buildMinimalQrVerificationUrl(docId, sha256, 'https://industrial-360.app');

      expect(qrUrl).toBe('https://industrial-360.app/verify-document?doc=PTS-PROINTECA-2026-001&hash=e3b0c44298fc1c14');
      expect(qrUrl).not.toContain('user@');
      expect(qrUrl).not.toContain('internal_server_path');
      expect(qrUrl).not.toContain('secret');
    });
  });

  describe('5. Alteración Criptográfica de Bytes (SHA-256)', () => {
    it('debe modificar completamente el hash SHA-256 al alterar 1 byte', async () => {
      const docOriginal = 'DOC:PTS-001|ORG:prointeca|AMOUNT:1000.00USD';
      const docAltered = 'DOC:PTS-001|ORG:prointeca|AMOUNT:1000.01USD'; // 1 byte cambiado

      const hash1 = await computeBrowserSha256(docOriginal);
      const hash2 = await computeBrowserSha256(docAltered);

      expect(hash1).not.toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash2).toHaveLength(64);
    });
  });

});
