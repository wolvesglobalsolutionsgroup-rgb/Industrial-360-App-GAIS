import { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, FileText, Loader2, Sparkles, X, Paperclip, Mic, Square, Volume2, Settings2, Link2 } from 'lucide-react';
import { callGeminiProxy } from '../lib/geminiProxy';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useProject } from '../ProjectContext';

export default function ProjectBrain() {
  const { currentProject } = useProject();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: 'Hola. Soy el Cerebro del Proyecto. Puedo analizar planos, especificaciones técnicas, cuadros de Excel y ayudarte a gestionar el proyecto, crear partidas, hacer estimaciones o resolver dudas. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectConfig, setProjectConfig] = useState<any>(null);

  useEffect(() => {
    async function loadConfig() {
      if (currentProject) {
        const docRef = doc(db, 'projects', currentProject.id);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().knowledgeContext) {
          setProjectConfig(snap.data().knowledgeContext);
        }
      }
    }
    loadConfig();
  }, [currentProject]);
  const [isHighThinking, setIsHighThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startRecording = async () => {
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
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await callGeminiProxy({
          model: 'gemini-3.6-flash',
          contents: [
            { text: 'Transcribe el siguiente audio del usuario. Solo devuelve el texto transcrito.' },
            { inlineData: { data: base64Audio, mimeType: 'audio/webm' } }
          ]
        });
        
        if (response.text) {
          setQuery(prev => prev ? `${prev} ${response.text}` : response.text);
        }
      };
    } catch (error) {
      console.error("Error transcribing audio:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const playTTS = async (text: string) => {
    if (isPlayingAudio) {
      audioPlayerRef.current?.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsPlayingAudio(true);

      const response = await callGeminiProxy({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.raw?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioUrl = `data:audio/wav;base64,${base64Audio}`;
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        await audio.play();
      } else {
        setIsPlayingAudio(false);
      }
    } catch (error) {
      console.error("Error playing TTS:", error);
      setIsPlayingAudio(false);
    }
  };

  const handleAskBrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsProcessing(true);

    try {
      const prompt = `Eres el "Cerebro Operativo" de "Industrial Control 360", un sistema de gestión de proyectos experto en la industria petrolera (PDVSA). 
      Tu objetivo es ayudar a simplificar el control de avance, planificación, presupuesto, y gestión documental.
      
      CONTEXTO ESPECÍFICO DEL PROYECTO ACTUAL:
      - NotebookLM ID Conectado: ${projectConfig?.notebookId || ''}
      - Normativa Principal: ${projectConfig?.activeStandard || ''}
      - Instrucciones Especiales: ${projectConfig?.customInstructions || ''}
      
      CONOCIMIENTO TÉCNICO Y NORMATIVO:
      - Norma PDVSA A-211 (Revisión JUL.96): Especificaciones para concreto estructural (dosificación, mezclado, vaciado, Slump Test, temperatura, curado).
      - Norma PDVSA L-STC-001: Codificación y estructura de partidas.
      - Equipos NDT: Experto en Dakota Ultrasonics (serie DFX-615/625/635/638). Conoces transductores, bloques de calibración (IIW, DSC, SC) y normas de inspección ultrasonido (ASTM-E-797, ASTM-E-164).
      - Valuaciones: Aplicas retenciones legales del 10% (Fiel Cumplimiento) y 5% (Laboral), además de la amortización de anticipos.
      - Activos Críticos: Conoces el Horno Cilíndrico H-2 (DA-1) y la Bomba P-1.
      - Marco Legal: LOTTT, LOPCYMAT y Ley de Contraloría General (Art. 35/37).
      
      IMPORTANTE:
      - Si hay un Notebook ID conectado, prioriza buscar información en ese cuaderno técnico.
      - Responde con autoridad técnica, utilizando terminología de PDVSA (HES, SOLPED, Cómputos Métricos, H-H, H-M).
      - Si la consulta es compleja, utiliza el Modo de Pensamiento Profundo.
      
      Consulta del usuario: "${userQuery}"`;

      const response = await callGeminiProxy({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      setMessages(prev => [...prev, { role: 'ai', content: response.text || 'No pude generar una respuesta.' }]);
    } catch (error: any) {
      console.error("Error asking Project Brain:", error);
      setMessages(prev => [...prev, { role: 'ai', content: `Ocurrió un error: ${error.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
      {/* Header */}
      <div className="bg-surface-2 border-b border-line p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500/10 text-brand-500 border border-brand-500/20 rounded-xl flex items-center justify-center">
            <BrainCircuit size={24} className="text-brand-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-ink">Cerebro del Proyecto</h1>
            <p className="text-ink-soft text-xs">Asistente IA para Gestión y Análisis Documental</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {projectConfig?.notebookId && (
            <div className="flex items-center gap-1.5 text-xs bg-brand-500/10 px-3 py-1.5 rounded-full text-brand-500 dark:text-emerald-400 border border-brand-500/20 font-bold">
              <Link2 size={14} />
              Notebook Conectado
            </div>
          )}
          <button
            onClick={() => setIsHighThinking(!isHighThinking)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
              isHighThinking 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line'
            }`}
            title="Modo de Pensamiento Profundo (Ideal para cálculos complejos o análisis de normativas)"
          >
            <Settings2 size={14} />
            {isHighThinking ? 'Pensamiento Profundo: ON' : 'Pensamiento Profundo: OFF'}
          </button>
          <div className="flex items-center gap-1.5 text-xs bg-brand-500/10 text-brand-500 dark:text-emerald-400 border border-brand-500/20 px-3 py-1.5 rounded-full font-bold">
            <Sparkles size={14} />
            Gemini 3.1 Pro
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-surface-2/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-2xs ${
              msg.role === 'user' 
                ? 'bg-brand-500 text-white rounded-tr-sm font-medium' 
                : 'bg-surface border border-line text-ink rounded-tl-sm'
            }`}>
              {msg.role === 'ai' && (
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-brand-500 dark:text-emerald-400 font-bold text-sm">
                    <BrainCircuit size={16} />
                    Cerebro IA
                  </div>
                  <button
                    onClick={() => playTTS(msg.content)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isPlayingAudio ? 'bg-brand-500/20 text-brand-500' : 'text-ink-faint hover:bg-surface-2 hover:text-ink'}`}
                    title={isPlayingAudio ? "Detener audio" : "Escuchar respuesta"}
                  >
                    {isPlayingAudio ? <Square size={14} /> : <Volume2 size={14} />}
                  </button>
                </div>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-inherit">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-surface border border-line shadow-2xs rounded-2xl rounded-tl-sm p-4 flex items-center gap-3 text-ink-soft">
              <Loader2 size={18} className="animate-spin text-brand-500" />
              <span className="text-sm font-medium">Analizando proyecto y documentos...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface border-t border-line shrink-0">
        <form onSubmit={handleAskBrain} className="relative flex items-end gap-2">
          <button 
            type="button"
            className="p-3 text-ink-faint hover:text-brand-500 hover:bg-surface-2 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Adjuntar documento (Plano, Excel, Spec)"
          >
            <Paperclip size={20} />
          </button>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-xl transition-colors shrink-0 cursor-pointer ${
              isRecording 
                ? 'bg-rose-500/20 text-rose-600 animate-pulse' 
                : 'text-ink-faint hover:text-brand-500 hover:bg-surface-2'
            }`}
            title={isRecording ? "Detener grabación" : "Dictar consulta"}
          >
            {isRecording ? <Square size={20} /> : <Mic size={20} />}
          </button>
          <div className="flex-1 relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Extrae las partidas necesarias del plano estructural adjunto o calcula el cómputo métrico..."
              className="w-full bg-surface-2 border border-line text-ink placeholder:text-ink-faint rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none text-xs sm:text-sm font-medium"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskBrain(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || isProcessing}
            className="p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button type="button" onClick={() => setQuery("¿Cuáles son las partidas críticas según las especificaciones técnicas?")} className="text-xs bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer">
            Analizar Especificaciones
          </button>
          <button type="button" onClick={() => setQuery("Ayúdame a hacer el cómputo métrico de la losa de fundación.")} className="text-xs bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer">
            Cómputos Métricos
          </button>
          <button type="button" onClick={() => setQuery("Genera un borrador de valuación para el avance de esta semana.")} className="text-xs bg-surface-2 hover:bg-elevated text-ink-soft hover:text-ink border border-line px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer">
            Generar Valuación
          </button>
        </div>
      </div>
    </div>
  );
}
