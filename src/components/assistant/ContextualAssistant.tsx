import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Mic,
  MicOff,
  Paperclip,
  FileText,
  X,
  Loader2,
  BrainCircuit,
  Settings2,
  Sparkles,
  Volume2,
  Square,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import { useDerivedAssistantContext } from './assistantContext';
import { sendAssistantQuery } from './assistantClient';
import {
  AssistantMode,
  AssistantMessage,
  AssistantAttachment,
} from './contracts';

interface ContextualAssistantProps {
  initialMode?: AssistantMode;
  className?: string;
  isEmbedded?: boolean;
}

export default function ContextualAssistant({
  initialMode,
  className = '',
  isEmbedded = false,
}: ContextualAssistantProps) {
  const context = useDerivedAssistantContext();
  const [activeMode, setActiveMode] = useState<AssistantMode>(
    initialMode || context.recommendedMode
  );

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AssistantAttachment | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [autoPlayTTS, setAutoPlayTTS] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize welcome message when context changes or component mounts
  useEffect(() => {
    let welcomeText = `Hola, soy el Asistente Contextual Unificado de IC360. Te asisto con rol **${context.userRole}** en la ruta \`${context.activeRoute}\`.`;

    if (context.workflowId && context.workflowTitle) {
      welcomeText += `\n\n🎯 **Workflow Activo:** ${context.workflowTitle} (\`${context.workflowId}\`) - Fase ${context.workflowPhase || 1}. Puedo ayudarte a validar Hard Gates o completar el formulario.`;
    } else if (context.routeCategory === 'field_inspector') {
      welcomeText += `\n\n👷 **Modo Inspección de Campo:** Consulta normas PDVSA A-211, soldadura CWI/NDT, o usa el micrófono para reportes de voz rápidos.`;
    } else if (context.routeCategory === 'siho_safety') {
      welcomeText += `\n\n🛡️ **Modo SIHO-A & PTW:** Asistencia en permisos de trabajo, análisis de riesgo ART, LOTO e higiene industrial.`;
    } else if (context.routeCategory === 'cost_financial') {
      welcomeText += `\n\n📊 **Modo FinOps & Valuaciones:** Verificación de APU, cómputos métricos, EVM (SPI/CPI) y amortizaciones.`;
    }

    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: welcomeText,
        mode: activeMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [context.activeRoute, context.workflowId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo supera el límite de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setAttachedFile({
        file,
        base64: base64String,
        mimeType: file.type || 'application/octet-stream',
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeQuery = async (queryText: string, audioBlob?: Blob) => {
    if (isLoading) return;
    setIsLoading(true);

    const userMsgId = `usr-${Date.now()}`;
    const assistantMsgId = `ast-${Date.now()}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let userTextToShow = queryText;
    if (attachedFile) {
      userTextToShow = `[Archivo adjunto: ${attachedFile.file.name}]\n${queryText}`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: userTextToShow,
        mode: activeMode,
        timestamp: nowStr,
        attachmentName: attachedFile?.file.name,
      },
    ]);

    setInput('');
    const currentAttachment = attachedFile;
    setAttachedFile(null);

    let audioInputData = undefined;
    if (audioBlob) {
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const res = (reader.result as string).split(',')[1];
          resolve(res);
        };
        reader.readAsDataURL(audioBlob);
      });
      audioInputData = { base64Audio, mimeType: 'audio/webm' };
    }

    const response = await sendAssistantQuery({
      mode: activeMode,
      prompt: queryText || 'Procesa esta consulta contextual.',
      context,
      attachment: currentAttachment || undefined,
      audioInput: audioInputData,
      isDeepThinking,
      requestTTS: activeMode === 'voice' && autoPlayTTS,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: response.text,
        mode: activeMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioBase64: response.audioBase64,
        isError: response.isError || response.isQuotaExceeded,
      },
    ]);

    if (response.audioBase64 && autoPlayTTS) {
      playAudio(response.audioBase64);
    }

    setIsLoading(false);
  };

  const handleSendText = () => {
    if (!input.trim() && !attachedFile) return;
    executeQuery(input.trim() || 'Analiza el documento adjunto.');
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await executeQuery('Consulta de voz dictada desde el terreno.', audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
      alert('No se pudo acceder al micrófono para el asistente de voz.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = (base64Audio: string) => {
    if (isPlayingAudio) {
      currentAudioRef.current?.pause();
      setIsPlayingAudio(false);
    }

    try {
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      setIsPlayingAudio(true);

      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);

      audio.play().catch(() => setIsPlayingAudio(false));
    } catch {
      setIsPlayingAudio(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${
        isEmbedded ? 'h-full min-h-[500px]' : 'h-[calc(100vh-8rem)]'
      } bg-surface rounded-2xl border border-line shadow-sm overflow-hidden ${className}`}
    >
      {/* Header Contextual Unificado */}
      <header className="px-5 py-3.5 border-b border-line bg-surface-2/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500/15 border border-brand-500/20 rounded-xl flex items-center justify-center text-brand-500 dark:text-emerald-400 font-bold">
            {activeMode === 'brain' ? (
              <BrainCircuit size={22} />
            ) : activeMode === 'voice' ? (
              <Mic size={22} />
            ) : (
              <Bot size={22} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-ink tracking-tight">
                Asistente Contextual IC360
              </h1>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 dark:text-emerald-400 border border-brand-500/20">
                Gemini 3.6 Proxy
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-soft font-medium mt-0.5">
              <span className="truncate max-w-[220px]">
                {context.workflowTitle
                  ? `Workflow: ${context.workflowTitle}`
                  : `Ruta: ${context.activeRoute}`}
              </span>
              <span>•</span>
              <span className="capitalize">{context.userRole}</span>
            </div>
          </div>
        </div>

        {/* Mode Switcher & Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Selector Pills */}
          <div className="flex items-center p-1 bg-surface border border-line rounded-xl">
            <button
              onClick={() => setActiveMode('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'chat'
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-ink-soft hover:text-ink hover:bg-surface-2'
              }`}
            >
              <Bot size={14} />
              Chat
            </button>
            <button
              onClick={() => setActiveMode('voice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'voice'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-ink-soft hover:text-ink hover:bg-surface-2'
              }`}
            >
              <Mic size={14} />
              Voz
            </button>
            <button
              onClick={() => setActiveMode('brain')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'brain'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-ink-soft hover:text-ink hover:bg-surface-2'
              }`}
            >
              <BrainCircuit size={14} />
              Cerebro
            </button>
          </div>

          {/* Deep Thinking Toggle */}
          <button
            onClick={() => setIsDeepThinking(!isDeepThinking)}
            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isDeepThinking
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-surface border-line text-ink-faint hover:text-ink'
            }`}
            title="Pensamiento Profundo para cálculos normativos y análisis complejo"
          >
            <Settings2 size={16} />
            <span className="hidden sm:inline">
              {isDeepThinking ? 'Pensamiento ON' : 'Pensamiento OFF'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-surface-2/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-brand-500/20 text-brand-500'
                  : 'bg-brand-500/15 text-brand-500 dark:text-emerald-400 border border-brand-500/20'
              }`}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div
              className={`max-w-[85%] md:max-w-[78%] rounded-2xl px-4 py-3.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-brand-500 text-white rounded-tr-none font-medium shadow-xs'
                  : 'bg-surface border border-line text-ink rounded-tl-none font-medium shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 gap-3">
                <span className="text-[11px] font-bold opacity-75">
                  {msg.role === 'user' ? 'Tú' : 'Asistente Contextual'}
                </span>
                <span className="text-[10px] opacity-60">{msg.timestamp}</span>
              </div>

              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-inherit leading-relaxed">
                  <Markdown>{msg.content}</Markdown>
                </div>
              )}

              {msg.audioBase64 && (
                <div className="mt-3 pt-2 border-t border-line/40 flex items-center gap-2">
                  <button
                    onClick={() => playAudio(msg.audioBase64!)}
                    className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-brand-500/10 text-brand-500 dark:text-emerald-400 rounded-lg hover:bg-brand-500/20 transition-colors cursor-pointer"
                  >
                    <Volume2 size={14} />
                    {isPlayingAudio ? 'Reproduciendo audio...' : 'Escuchar respuesta por voz'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/15 text-brand-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-surface border border-line rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2.5 text-ink-soft text-xs font-medium">
              <Loader2 size={16} className="animate-spin text-brand-500 dark:text-emerald-400" />
              <span>
                {isDeepThinking
                  ? 'Ejecutando razonamiento paso a paso con contexto real...'
                  : 'Sintetizando respuesta contextual...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Mode Special View if active and recording */}
      {activeMode === 'voice' && (
        <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                isRecording ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
              }`}
            >
              <Mic size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">
                {isRecording
                  ? 'Grabando audio de terreno...'
                  : 'Asistente de Voz en Terreno Activado'}
              </p>
              <p className="text-[11px] text-ink-soft">
                {isRecording
                  ? 'Presiona Detener para enviar tu mensaje vocal.'
                  : 'Toca el micrófono abajo o el botón central para dictar.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoPlayTTS(!autoPlayTTS)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                autoPlayTTS
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-surface border-line text-ink-faint'
              }`}
            >
              {autoPlayTTS ? 'Voz de Salida: ON' : 'Voz de Salida: OFF'}
            </button>
            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl font-bold text-xs text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {isRecording ? <Square size={14} /> : <Mic size={14} />}
              {isRecording ? 'Detener' : 'Grabar Voz'}
            </button>
          </div>
        </div>
      )}

      {/* Input Action Controls */}
      <div className="p-4 bg-surface border-t border-line shrink-0 space-y-2">
        {attachedFile && (
          <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-emerald-400 px-3 py-1.5 rounded-xl w-fit text-xs font-bold">
            <FileText size={15} />
            <span className="truncate max-w-[200px]">{attachedFile.file.name}</span>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-1 hover:bg-brand-500/20 rounded-full transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.png,.jpg"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-ink-soft hover:text-brand-500 hover:bg-surface-2 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Adjuntar archivo o plano"
          >
            <Paperclip size={18} />
          </button>

          <button
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className={`p-3 rounded-xl transition-colors cursor-pointer shrink-0 ${
              isRecording
                ? 'bg-rose-500/20 text-rose-600 animate-pulse'
                : 'text-ink-soft hover:text-brand-500 hover:bg-surface-2'
            }`}
            title={isRecording ? 'Detener dictado' : 'Dictar mensaje'}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder={
              context.workflowTitle
                ? `Haz una pregunta sobre ${context.workflowTitle}...`
                : 'Consulta técnica, normativas, cálculos o estado del proyecto...'
            }
            className="flex-1 px-4 py-2.5 bg-surface-2 border border-line text-ink placeholder:text-ink-faint rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs sm:text-sm font-medium"
          />

          <button
            onClick={handleSendText}
            disabled={isLoading || (!input.trim() && !attachedFile)}
            className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl transition-colors flex items-center justify-center cursor-pointer shadow-xs shrink-0"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Quick Context Action Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 custom-scrollbar text-[11px]">
          <span className="text-ink-faint font-medium shrink-0">Sugerencias:</span>
          {context.workflowTitle ? (
            <>
              <button
                onClick={() =>
                  setInput(`¿Cuáles son los Hard Gates requeridos para ${context.workflowTitle}?`)
                }
                className="px-2.5 py-1 bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line rounded-full whitespace-nowrap transition-colors cursor-pointer"
              >
                Hard Gates Requeridos
              </button>
              <button
                onClick={() => setInput('¿Qué campos son obligatorios según el esquema Zod?')}
                className="px-2.5 py-1 bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line rounded-full whitespace-nowrap transition-colors cursor-pointer"
              >
                Esquema & Reglas
              </button>
            </>
          ) : context.routeCategory === 'field_inspector' ? (
            <>
              <button
                onClick={() => setInput('Resume los criterios de aceptación NDT según ASME B31.3')}
                className="px-2.5 py-1 bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line rounded-full whitespace-nowrap transition-colors cursor-pointer"
              >
                Criterios NDT ASME B31.3
              </button>
              <button
                onClick={() => setInput('Genera la estructura de un informe de campo diario')}
                className="px-2.5 py-1 bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line rounded-full whitespace-nowrap transition-colors cursor-pointer"
              >
                Estructura Informe Diario
              </button>
            </>
          ) : context.routeCategory === 'siho_safety' ? (
            <>
              <button
                onClick={() => setInput('¿Cuáles son los requisitos para un Permiso de Trabajo Frío/Caliente SIHO?')}
                className="px-2.5 py-1 bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line rounded-full whitespace-nowrap transition-colors cursor-pointer"
              >
                Requisitos PTW SIHO
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setInput('Resume el estado de avance e indicadores EVM del proyecto')}
                className="px-2.5 py-1 bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line rounded-full whitespace-nowrap transition-colors cursor-pointer"
              >
                Resumen Indicadores EVM
              </button>
              <button
                onClick={() => setInput('Ayúdame a redactar una minuta técnica de avance')}
                className="px-2.5 py-1 bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line rounded-full whitespace-nowrap transition-colors cursor-pointer"
              >
                Redactar Minuta Técnica
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
