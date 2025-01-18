import { Game } from '@/lib/game';
import { generateCrowdMembers } from '@/lib/utils';
import { AudioState, ConversationEntry, CrowdMember, GameSettings, GameState } from '@/types';
import { atom } from 'jotai';

const initialGameState: GameState = {
  isPlaying: false,
  totalRounds: 5,
  currentRound: 0,
  startTime: null,
  endTime: null,
  stockPrice: 100,
  initialStockPrice: 100,
  talkedAgents: new Set<number>(),
  showWelcomeDialog: false,
  companyName: '',
  companyBackground: '',
  ceoName: '',
};

/**
 * @description Game state atom - manages core game mechanics
 */
export const gameStateAtom = atom<GameState>(initialGameState);

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
 * @description Computed atom for game status
 */
export const gameStatusAtom = atom((get) => {
  const { isPlaying, startTime, endTime } = get(gameStateAtom);

  if (!isPlaying && !startTime && !endTime) return 'idle';
  if (isPlaying) return 'playing';
  return 'finished';
});

/**
 * @description Stock price history for charting
 */
export const stockPriceHistoryAtom = atom<
  {
    timestamp: number;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[]
>([]);

/**
 * @description UI state atoms
 */
export const isSpeakingAtom = atom(false);
export const isProcessingResponseAtom = atom(false);
export const showCrowdAtom = atom(true);

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

/**
 * @description Game instance atom
 */
export const gameInstanceAtom = atom<Game | null>(null);
