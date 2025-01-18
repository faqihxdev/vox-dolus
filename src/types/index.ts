/**
 * @description Types for the game state management
 */
export interface GameState {
  isPlaying: boolean;
  totalRounds: number;
  currentRound: number;
  startTime: number | null;
  endTime: number | null;
  stockPrice: number;
  initialStockPrice: number;
  currentSentiment?: number;
  talkedAgents: Set<number>;
  companyName?: string;
  companyBackground?: string;
  ceoName?: string;
  showWelcomeDialog: boolean;
}

export interface CrowdMember {
  id: string;
  agentIdx: number;
  seed: string;
  hasQuestion: boolean;
  isTalking: boolean;
  name: string;
  network: string;
}

export interface ConversationEntry {
  id: string;
  type: 'question' | 'response';
  text: string;
  audioUrl?: string;
  timestamp: number;
  stockPriceImpact: number;
}

export interface AudioState {
  isRecording: boolean;
  currentRecording: {
    base64: string;
    blob: Blob;
    timestamp: number;
  } | null;
  selectedDevice: string | null;
  error: string | null;
}

export interface GameSettings {
  volume: number;
  microphoneId: string | null;
  showTranscripts: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

export interface Agent {
  name: string;
  persona: string;
  network: string;
  voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
}
