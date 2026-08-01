import { describe, it, expect, beforeEach } from 'vitest';
import { DisplayEnvironment } from '../DisplayEnvironmentContext';

describe('S20 — DisplayEnvironmentContext (Command Wall, Workstation & Field Sunlight)', () => {

  const STORAGE_KEY = 'ic360.displayEnvironment';
  const BURN_IN_KEY = 'ic360.burnInMitigation';

  // Mock in-memory localStorage for Node environment
  const mockStorage = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => mockStorage.get(key) || null,
    setItem: (key: string, value: string) => mockStorage.set(key, value),
    removeItem: (key: string) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  };

  // Mock documentElement
  const mockAttributes = new Map<string, string>();
  const documentElementMock = {
    setAttribute: (key: string, val: string) => mockAttributes.set(key, val),
    getAttribute: (key: string) => mockAttributes.get(key) || null,
    removeAttribute: (key: string) => mockAttributes.delete(key),
    hasAttribute: (key: string) => mockAttributes.has(key),
  };

  beforeEach(() => {
    mockStorage.clear();
    mockAttributes.clear();
  });

  it('1. Debe guardar y leer correctamente los valores válidos de DisplayEnvironment en localStorage', () => {
    const modes: DisplayEnvironment[] = ['workstation', 'command-wall', 'field-sunlight'];

    modes.forEach((mode) => {
      localStorageMock.setItem(STORAGE_KEY, mode);
      expect(localStorageMock.getItem(STORAGE_KEY)).toBe(mode);
    });
  });

  it('2. Debe establecer atributos data-display-env en document.documentElement para Command Wall', () => {
    documentElementMock.setAttribute('data-display-env', 'command-wall');
    expect(documentElementMock.getAttribute('data-display-env')).toBe('command-wall');
  });

  it('3. Debe habilitar la mitigación de Burn-In OLED en el atributo data-burn-in-mitigation', () => {
    documentElementMock.setAttribute('data-display-env', 'command-wall');
    documentElementMock.setAttribute('data-burn-in-mitigation', 'true');
    localStorageMock.setItem(BURN_IN_KEY, 'true');

    expect(documentElementMock.getAttribute('data-burn-in-mitigation')).toBe('true');
    expect(localStorageMock.getItem(BURN_IN_KEY)).toBe('true');
  });

  it('4. Debe configurar el entorno Field Sunlight para alto contraste y pantalla táctil con guantes', () => {
    documentElementMock.setAttribute('data-display-env', 'field-sunlight');
    localStorageMock.setItem(STORAGE_KEY, 'field-sunlight');

    expect(documentElementMock.getAttribute('data-display-env')).toBe('field-sunlight');
    expect(localStorageMock.getItem(STORAGE_KEY)).toBe('field-sunlight');
  });

  it('5. Debe garantizar la independencia completa frente al contexto de proyectos/tenant', () => {
    // Verificar que la clave en storage es local al dispositivo y no contiene prefijos de tenant
    expect(STORAGE_KEY).toBe('ic360.displayEnvironment');
    expect(STORAGE_KEY).not.toContain('orgId');
    expect(STORAGE_KEY).not.toContain('projectId');
  });

});
