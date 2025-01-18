import { generateCrowdMembers } from '@/lib/utils';
import { AudioState, ConversationEntry, CrowdMember, GameSettings, GameState } from '@/types';
import { atom } from 'jotai';

const initialGameState: GameState = {
  isPlaying: false,
  duration: 60,
  startTime: null,
  endTime: null,
  stockPrice: 100,
  initialStockPrice: 100,
  talkedAgents: new Set<number>(),
};

/**
 * @description Game state atom - manages core game mechanics
 */
export const gameStateAtom = atom<GameState>(initialGameState);

/**
 * @description Timer update atom - used to force timer updates without full re-renders
 */
export const timerUpdateAtom = atom(0);

/**
 * @description Conversation history atom - tracks all Q&A interactions
 */
export const conversationHistoryAtom = atom<ConversationEntry[]>([]);

/**
 * @description Audio recording state atom - manages recording mechanics
 */
export const audioStateAtom = atom<AudioState>({
  isRecording: false,
  currentRecording: null,
  selectedDevice: null,
  error: null,
});

/**
 * @description Computed atom for remaining time
 */
export const remainingTimeAtom = atom((get) => {
  const { startTime, duration, isPlaying } = get(gameStateAtom);
  get(timerUpdateAtom); // Subscribe to timer updates

  if (!isPlaying || !startTime) return duration;

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remaining = duration - elapsed;

  return Math.max(0, remaining);
});

/**
 * @description Computed atom for game status
 */
export const gameStatusAtom = atom((get) => {
  const { isPlaying, startTime, endTime } = get(gameStateAtom);
  const remainingTime = get(remainingTimeAtom);

  if (!isPlaying && !startTime && !endTime) return 'idle';
  if (isPlaying && remainingTime > 0) return 'playing';
  return 'finished';
});

/**
 * @description Stock price history for charting
 */
export const stockPriceHistoryAtom = atom<{ timestamp: number; price: number }[]>([]);

/**
 * @description UI state atoms
 */
export const isQuestionGeneratingAtom = atom(false);
export const isSpeakingAtom = atom(false);
export const isProcessingResponseAtom = atom(false);
export const showCrowdAtom = atom(true);
export const showHandAtom = atom(false);

/**
 * @description Game settings atom
 */
export const gameSettingsAtom = atom<GameSettings>({
  volume: 1,
  microphoneId: null,
  showTranscripts: true,
  difficulty: 'normal',
});

/**
 * @description Error state atom
 */
export const errorAtom = atom<string | null>(null);

/**
 * @description Crowd members atom - manages the audience
 */
export const crowdMembersAtom = atom<CrowdMember[]>(generateCrowdMembers());
