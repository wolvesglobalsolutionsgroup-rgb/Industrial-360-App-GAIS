import { describe, it, expect } from 'vitest';
import {
  wf075Definition,
  SiteLogbookSchema,
  createInitialSiteLogbookData,
  createDefaultSiteLogbookEntry,
} from '../definition';

describe('Workflow wf-075: Libro de Obra Digital y Asientos Diarios', () => {
  const dummyContext = {
    user: { email: 'inspector.libro@ic360.io' },
    contractorBrand: { companyName: 'CONTRATISTA OBRA S.A.' },
    operatorBrand: { companyName: 'OPERADOR PETRÓLEO S.A.' },
  };

  it('1. Genera capturas iniciales por defecto completamente vacías / sin sellar', () => {
    const initialData = createInitialSiteLogbookData();

    expect(initialData.bookCode).toBe('');
    expect(initialData.startDate).toBe('');
    expect(initialData.endDate).toBe('');
    expect(initialData.contractorName).toBe('');
    expect(initialData.residentEngineer).toBe('');
    expect(initialData.inspectorName).toBe('');
    expect(initialData.sectionsCount).toBe(16);
    expect(initialData.dailyEntries).toEqual([]);
    expect(initialData.isSealed).toBe(false);
  });

  it('2. createDefaultSiteLogbookEntry genera un asiento con fecha y clima vacíos sin evidencia ficticia', () => {
    const defaultEntry = createDefaultSiteLogbookEntry(1);

    expect(defaultEntry.entryNumber).toBe(1);
    expect(defaultEntry.date).toBe('');
    expect(defaultEntry.description).toBe('');
    expect(defaultEntry.weatherCondition).toBe('');
    expect(defaultEntry.manpowerCount).toBe(0);
    expect(defaultEntry.incidentsReported).toBe(false);
  });

  it('3. Bloquea mediante Hard Gate si el Libro de Obra no ha sido sellado digitalmente', () => {
    const unsealedGate = wf075Definition.hardGates.find((g) => g.id === 'UNSEALED_BOOK');
    expect(unsealedGate).toBeDefined();

    const initialData = createInitialSiteLogbookData();
    const result = unsealedGate!.evaluator(dummyContext, initialData);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('BLOQUEO DE LIBRO DE OBRA');
  });

  it('4. Bloquea mediante Hard Gate la ausencia de asientos o asientos incompletos (sin fecha, descripción o clima)', () => {
    const missingEntriesGate = wf075Definition.hardGates.find((g) => g.id === 'MISSING_DAILY_ENTRIES');
    expect(missingEntriesGate).toBeDefined();

    // Sin asientos
    const noEntriesData = { ...createInitialSiteLogbookData(), isSealed: true };
    expect(missingEntriesGate!.evaluator(dummyContext, noEntriesData).passed).toBe(false);

    // Asiento nuevo por defecto (sin fecha, sin descripción, sin clima)
    const incompleteEntryData = {
      ...createInitialSiteLogbookData(),
      isSealed: true,
      dailyEntries: [createDefaultSiteLogbookEntry(1)],
    };

    const incompleteResult = missingEntriesGate!.evaluator(dummyContext, incompleteEntryData);
    expect(incompleteResult.passed).toBe(false);
    expect(incompleteResult.message).toContain('BLOQUEO TÉCNICO');
  });

  it('5. Permite el paso de los Hard Gates cuando existen asientos diarios válidos y el libro está sellado', () => {
    const unsealedGate = wf075Definition.hardGates.find((g) => g.id === 'UNSEALED_BOOK');
    const missingEntriesGate = wf075Definition.hardGates.find((g) => g.id === 'MISSING_DAILY_ENTRIES');

    const validData = {
      ...createInitialSiteLogbookData(),
      bookCode: 'LO-2026-001',
      isSealed: true,
      dailyEntries: [
        {
          entryNumber: 1,
          date: '2026-08-09',
          description: 'Inspección de zanjas y colocación de cama de arena en KP 10+200.',
          weatherCondition: 'bueno' as const,
          manpowerCount: 12,
          incidentsReported: false,
        },
      ],
    };

    expect(unsealedGate!.evaluator(dummyContext, validData).passed).toBe(true);
    expect(missingEntriesGate!.evaluator(dummyContext, validData).passed).toBe(true);
  });

  it('6. Valida esquema Zod ante campos incompletos o número de secciones incorrecto', () => {
    const invalidData = {
      bookCode: 'AB', // min 3
      startDate: 'invalid-date',
      endDate: 'invalid-date',
      contractorName: '',
      residentEngineer: '',
      inspectorName: '',
      sectionsCount: 10, // min 16
      dailyEntries: [],
      isSealed: false,
    };

    const parseResult = SiteLogbookSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
  });

  it('7. Genera un DocumentViewModel con estado DRAFT/SEALED y firmantes PENDING sin nombres de persona ficticios', () => {
    const dataWithoutCapturedSigners = {
      ...createInitialSiteLogbookData(),
      bookCode: 'LO-2026-001',
      startDate: '2026-08-01',
      endDate: '2026-08-09',
      contractorName: 'CONTRATISTA PIPELINE C.A.',
      residentEngineer: '', // No capturado
      inspectorName: '', // No capturado
      sectionsCount: 16,
      dailyEntries: [
        {
          entryNumber: 1,
          date: '2026-08-09',
          description: 'Apertura de Libro de Obra e inicio de vaciado de fundaciones.',
          weatherCondition: 'bueno' as const,
          manpowerCount: 15,
          incidentsReported: false,
        },
      ],
      isSealed: true,
    };

    const docVM = wf075Definition.deliverable.factory(dummyContext, dataWithoutCapturedSigners);

    expect(docVM.status).toBe('SEALED');
    expect(docVM.code).toBe('LO-2026-001');
    expect(docVM.signers.length).toBe(3);

    // Confirmar que no se asignó signedAt y que no hay nombres de personas ni roles como nombre
    docVM.signers.forEach((s) => {
      expect(s.status).toBe('PENDING');
      expect(s.signedAt).toBeUndefined();
      expect(s.name).toBe(''); // Nombre vacío si no fue capturado
      expect(['INSPECTOR', 'CONTRACTOR', 'OPERATOR']).toContain(s.role);
    });
  });
});
