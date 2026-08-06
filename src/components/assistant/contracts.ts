import { WorkflowDefinition } from '../../lib/workflows/contracts';

export type AssistantMode = 'chat' | 'voice' | 'brain';

export type RouteCategory =
  | 'workflow'
  | 'field_inspector'
  | 'engineering'
  | 'cost_financial'
  | 'siho_safety'
  | 'general';

export interface AssistantContextData {
  activeRoute: string;
  routeCategory: RouteCategory;
  workflowId?: string;
  workflowTitle?: string;
  workflowPhase?: number;
  workflowDefinition?: WorkflowDefinition;
  userRole: string;
  orgId: string;
  projectId: string;
  projectName: string;
  recommendedMode: AssistantMode;
  systemInstruction: string;
}

export interface AssistantAttachment {
  file: File;
  base64: string;
  mimeType: string;
}

export interface AssistantAudioInput {
  base64Audio: string;
  mimeType: string;
}

export interface AssistantQueryOptions {
  mode: AssistantMode;
  prompt: string;
  context: AssistantContextData;
  attachment?: AssistantAttachment;
  audioInput?: AssistantAudioInput;
  isDeepThinking?: boolean;
  requestTTS?: boolean;
}

export interface AssistantResponse {
  text: string;
  audioBase64?: string;
  isError?: boolean;
  isQuotaExceeded?: boolean;
  modelUsed: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: AssistantMode;
  timestamp: string;
  audioBase64?: string;
  attachmentName?: string;
  isError?: boolean;
}
