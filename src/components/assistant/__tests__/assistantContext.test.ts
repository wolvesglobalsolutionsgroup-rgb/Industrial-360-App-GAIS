import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deriveRouteCategory,
  deriveRecommendedMode,
  buildSystemInstruction,
  buildAssistantContext,
} from '../assistantContext';
import { sendAssistantQuery } from '../assistantClient';
import * as geminiProxyModule from '../../../lib/geminiProxy';

vi.mock('../../../lib/geminiProxy', () => ({
  callGeminiProxy: vi.fn(),
}));

describe('Contextual Assistant - Context Derivation & Routing', () => {
  it('correctly derives route categories for IC360 modules', () => {
    expect(deriveRouteCategory('/workflows/wf-042/instance-1')).toBe('workflow');
    expect(deriveRouteCategory('/qa-qc-welding')).toBe('field_inspector');
    expect(deriveRouteCategory('/field-reports')).toBe('field_inspector');
    expect(deriveRouteCategory('/siho-ptw')).toBe('siho_safety');
    expect(deriveRouteCategory('/loto-isolation')).toBe('siho_safety');
    expect(deriveRouteCategory('/valuations')).toBe('cost_financial');
    expect(deriveRouteCategory('/expenses')).toBe('cost_financial');
    expect(deriveRouteCategory('/apu-estimation')).toBe('cost_financial');
    expect(deriveRouteCategory('/tools')).toBe('engineering');
    expect(deriveRouteCategory('/hot-tap')).toBe('engineering');
    expect(deriveRouteCategory('/')).toBe('general');
  });

  it('correctly derives recommended assistant modes', () => {
    expect(deriveRecommendedMode('/voice')).toBe('voice');
    expect(deriveRecommendedMode('/project-brain')).toBe('brain');
    expect(deriveRecommendedMode('/workflows/wf-042')).toBe('brain');
    expect(deriveRecommendedMode('/chat')).toBe('chat');
    expect(deriveRecommendedMode('/dashboard')).toBe('chat');
  });

  it('builds system instructions with multi-tenant and route isolation', () => {
    const instruction = buildSystemInstruction({
      pathname: '/qa-qc-welding',
      category: 'field_inspector',
      userRole: 'inspector',
      orgId: 'org-pdvsa-01',
      projectId: 'proj-gasoducto',
      projectName: 'Proyecto Gasoducto 26',
    });

    expect(instruction).toContain('Ruta Activa: /qa-qc-welding');
    expect(instruction).toContain('Rol del Usuario: inspector');
    expect(instruction).toContain('Organización (Tenant): org-pdvsa-01');
    expect(instruction).toContain('Proyecto Activo: [proj-gasoducto] Proyecto Gasoducto 26');
    expect(instruction).toContain('Modo Inspección de Campo');
  });

  it('includes workflow metadata when on a workflow route', () => {
    const context = buildAssistantContext({
      pathname: '/workflows/wf-042/instance-99',
      userRole: 'supervisor',
      orgId: 'org-test',
      projectId: 'proj-test',
      projectName: 'Test Workflow Project',
      workflowIdParam: 'wf-042',
    });

    expect(context.workflowId).toBe('wf-042');
    expect(context.routeCategory).toBe('workflow');
    expect(context.recommendedMode).toBe('brain');
    expect(context.systemInstruction).toContain('ID Workflow: wf-042');
  });
});

describe('Contextual Assistant - Client & Proxy Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes query strictly through callGeminiProxy without direct client SDK calls', async () => {
    const mockCall = vi.mocked(geminiProxyModule.callGeminiProxy);
    mockCall.mockResolvedValueOnce({
      text: 'Respuesta procesada correctamente por el proxy.',
      raw: { candidates: [] },
    });

    const mockContext = buildAssistantContext({
      pathname: '/qa-qc-welding',
      userRole: 'inspector',
      orgId: 'org-1',
      projectId: 'p-1',
      projectName: 'P1',
    });

    const result = await sendAssistantQuery({
      mode: 'chat',
      prompt: '¿Cómo evalúo la junta de soldadura W-01?',
      context: mockContext,
    });

    expect(mockCall).toHaveBeenCalledTimes(1);
    expect(mockCall).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.6-flash',
        systemInstruction: mockContext.systemInstruction,
        contents: expect.arrayContaining(['¿Cómo evalúo la junta de soldadura W-01?']),
      })
    );

    expect(result.text).toBe('Respuesta procesada correctamente por el proxy.');
    expect(result.isError).toBe(false);
  });

  it('handles API quota limits gracefully without throwing runtime errors', async () => {
    const mockCall = vi.mocked(geminiProxyModule.callGeminiProxy);
    mockCall.mockResolvedValueOnce({
      text: 'Límite de cuota API Gemini alcanzado. Operando con datos predeterminados de contingencia.',
      raw: { quotaExceeded: true },
    });

    const mockContext = buildAssistantContext({
      pathname: '/siho-ptw',
    });

    const result = await sendAssistantQuery({
      mode: 'chat',
      prompt: 'Verificar PTW',
      context: mockContext,
    });

    expect(result.isQuotaExceeded).toBe(true);
    expect(result.text).toContain('cuota API Gemini alcanzado');
  });

  it('handles server errors gracefully with offline fallback message', async () => {
    const mockCall = vi.mocked(geminiProxyModule.callGeminiProxy);
    mockCall.mockRejectedValueOnce(new Error('Network error'));

    const mockContext = buildAssistantContext({
      pathname: '/tools',
    });

    const result = await sendAssistantQuery({
      mode: 'chat',
      prompt: 'Cálculo ASME',
      context: mockContext,
    });

    expect(result.isError).toBe(true);
    expect(result.text).toContain('No se pudo conectar con el asistente');
  });
});
