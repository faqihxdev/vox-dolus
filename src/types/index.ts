/**
 * @description Types for the game state management
 */
export interface GameState {
  isPlaying: boolean;
  duration: number;
  startTime: number | null;
  endTime: number | null;
  stockPrice: number;
  initialStockPrice: number;
  currentSentiment?: number;
}

export interface CrowdMember {
  id: string;
  seed: string;
  hasQuestion: boolean;
  isTalking: boolean;
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
