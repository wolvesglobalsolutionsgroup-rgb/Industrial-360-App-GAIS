import { getAuth } from 'firebase/auth';

export interface GeminiRequestOptions {
  prompt?: string;
  model?: string;
  systemInstruction?: string;
  contents?: any;
  config?: any;
}

export async function callGeminiProxy(options: GeminiRequestOptions): Promise<{ text: string; raw?: any }> {
  try {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      return { text: 'Sesión no autenticada.', raw: { error: true } };
    }

    const response = await fetch('/api/callGeminiProxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: response.statusText }));
      if (response.status === 429) {
        return {
          text: 'Límite de cuota API Gemini alcanzado. Operando con datos predeterminados de contingencia.',
          raw: { quotaExceeded: true }
        };
      }
      throw new Error(errData.error || `Error en el servidor (${response.status})`);
    }

    const data = await response.json();
    return {
      text: data.text || '',
      raw: data,
    };
  } catch (error: any) {
    console.warn('Advertencia en llamada a Gemini Proxy (usando respaldo):', error.message || error);
    return {
      text: 'Información temporalmente no disponible por restricción de cuota en servicio AI. Operación en modo local.',
      raw: { error: true }
    };
  }
}

export async function callGeminiStructured<T>(
  prompt: string,
  schema: object,
  systemInstruction?: string
): Promise<T | null> {
  const result = await callGeminiProxy({
    prompt,
    systemInstruction,
    config: { responseMimeType: 'application/json', responseSchema: schema }
  });
  if (result.raw?.error) return null;
  try { return JSON.parse(result.text) as T; } catch { return null; }
}
