import { callGeminiProxy } from '../../lib/geminiProxy';
import { AssistantQueryOptions, AssistantResponse } from './contracts';

/**
 * Single canonical client for the Unified Contextual Assistant.
 * Routes 100% of queries through callGeminiProxy (/api/callGeminiProxy).
 * Zero direct client-side AI SDK imports.
 */
export async function sendAssistantQuery(
  options: AssistantQueryOptions
): Promise<AssistantResponse> {
  const {
    mode,
    prompt,
    context,
    attachment,
    audioInput,
    isDeepThinking = false,
    requestTTS = false,
  } = options;

  try {
    const contents: any[] = [];
    let effectiveModel = 'gemini-3.6-flash';

    // 1. Voice audio input or file attachment
    if (audioInput) {
      contents.push({
        inlineData: {
          data: audioInput.base64Audio,
          mimeType: audioInput.mimeType,
        },
      });
    }

    if (attachment) {
      contents.push({
        inlineData: {
          data: attachment.base64,
          mimeType: attachment.mimeType,
        },
      });
    }

    // 2. Build prompt with context & deep thinking instruction if requested
    let fullPrompt = prompt;
    if (isDeepThinking) {
      fullPrompt = `[MODO PENSAMIENTO PROFUNDO ACTIVADO - EJECUTA ANÁLISIS PASO A PASO]\n${fullPrompt}`;
    }

    if (attachment) {
      fullPrompt += `\n\n[DOCUMENTO ADJUNTO: ${attachment.file.name}] Por favor analiza e integra el documento adjunto en la respuesta.`;
    }

    contents.push(fullPrompt);

    // 3. Invoke canonical proxy
    const proxyResponse = await callGeminiProxy({
      model: effectiveModel,
      systemInstruction: context.systemInstruction,
      contents,
    });

    // Check if error or quota exceeded
    if (proxyResponse.raw?.quotaExceeded) {
      return {
        text: proxyResponse.text || 'Límite de cuota API Gemini alcanzado. Modo contingencia de datos.',
        isError: false,
        isQuotaExceeded: true,
        modelUsed: effectiveModel,
      };
    }

    if (proxyResponse.raw?.error && !proxyResponse.text) {
      return {
        text: 'El servicio de IA no está disponible en este momento. Se activó el modo de respaldo local.',
        isError: true,
        modelUsed: effectiveModel,
      };
    }

    const responseText = proxyResponse.text || 'Sin respuesta generada por el asistente.';
    let audioBase64: string | undefined = undefined;

    // 4. Handle TTS request if voice mode or requestedTTS
    if ((mode === 'voice' || requestTTS) && responseText) {
      try {
        const ttsResponse = await callGeminiProxy({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: responseText.slice(0, 500) }] }], // cap text for fast TTS
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
          },
        });

        const candidates = ttsResponse.raw?.candidates;
        const candidateAudio = candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (candidateAudio) {
          audioBase64 = candidateAudio;
        }
      } catch (ttsErr) {
        console.warn('Advertencia en generación de audio TTS (fallback a sólo texto):', ttsErr);
      }
    }

    return {
      text: responseText,
      audioBase64,
      isError: false,
      modelUsed: effectiveModel,
    };
  } catch (error: any) {
    console.error('Error en sendAssistantQuery:', error);
    return {
      text: 'No se pudo conectar con el asistente de IA. Operando en modo desconectado.',
      isError: true,
      modelUsed: 'local-fallback',
    };
  }
}
