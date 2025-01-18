'use client';

import { AudioPlayer } from '@/components/audio-player';
import { Crowd } from '@/components/crowd';
import { MicrophoneSelector } from '@/components/mic-selector';
import { PushToTalk } from '@/components/push-to-talk';
import { Timer } from '@/components/timer';
import { Button } from '@/components/ui/button';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { GAME_AGENTS, generateCrowdMembers, raiseRandomHands } from '@/lib/utils';
import {
  crowdMembersAtom,
  gameStateAtom,
  gameStatusAtom,
  remainingTimeAtom,
  timerUpdateAtom,
} from '@/stores';
import { CrowdMember } from '@/types';
import { useAtom } from 'jotai';
import { memo, useCallback, useEffect } from 'react';

const GAME_DURATIONS = [30, 60, 90, 120] as const;

/**
 * @description Memoized recording section to prevent re-renders from timer updates
 */
const RecordingSection = memo(function RecordingSection({
  recording,
  sentiment,
}: {
  recording: { blob: Blob } | null;
  sentiment?: number;
}) {
  return (
    <div className='flex flex-col items-center gap-4'>
      {recording && <AudioPlayer blob={recording.blob} />}
      {sentiment !== undefined && (
        <div
          className={`text-lg font-medium ${
            sentiment > 0 ? 'text-green-600' : sentiment < 0 ? 'text-red-600' : 'text-yellow-600'
          }`}
        >
          Sentiment: {sentiment > 0 ? '+' : ''}
          {sentiment}
        </div>
      )}
    </div>
  );
});

export default function Home() {
  const { recording, isRecording, error, startRecording, stopRecording, clearRecording } =
    useAudioRecorder();
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [remainingTime] = useAtom(remainingTimeAtom);
  const [gameStatus] = useAtom(gameStatusAtom);
  const [, setTimerUpdate] = useAtom(timerUpdateAtom);
  const [crowdMembers, setCrowdMembers] = useAtom(crowdMembersAtom);

  // Handle crowd member click
  const handleCrowdMemberClick = useCallback(
    (member: CrowdMember) => {
      if (!member.hasQuestion || member.isTalking) return;

      // Update member state and talked agents
      setCrowdMembers((prev) =>
        prev.map((m) => ({
          ...m,
          hasQuestion: m.id === member.id ? false : m.hasQuestion,
          isTalking: m.id === member.id,
        }))
      );

      setGameState((prev) => {
        const newTalkedAgents = new Set(prev.talkedAgents);
        newTalkedAgents.add(member.agentIdx);
        // If all agents have talked, reset the set
        if (newTalkedAgents.size === GAME_AGENTS.length) {
          return {
            ...prev,
            talkedAgents: new Set(),
          };
        }
        return {
          ...prev,
          talkedAgents: newTalkedAgents,
        };
      });

      // After 3 seconds, stop talking and raise new hands
      setTimeout(() => {
        // Get the latest state values
        setGameState((prev) => {
          setCrowdMembers((members) =>
            raiseRandomHands(
              members.map((m) => ({
                ...m,
                isTalking: m.id === member.id ? false : m.isTalking,
              })),
              prev.talkedAgents
            )
          );
          return prev;
        });
      }, 3000);
    },
    [setCrowdMembers, setGameState]
  );

  // Process recording when it changes
  useEffect(() => {
    if (recording?.base64 && gameStatus === 'playing') {
      const sentiment: number = Math.random() * 2 - 1;
      setGameState((prev) => ({
        ...prev,
        currentSentiment: sentiment,
        // Update stock price based on sentiment
        stockPrice: prev.stockPrice * (1 + sentiment * 0.1), // 10% max impact
      }));

      // After processing audio, raise new hands
      setCrowdMembers((prev) => raiseRandomHands(prev, gameState.talkedAgents));
    }
  }, [recording, gameStatus, setGameState, setCrowdMembers, gameState.talkedAgents]);

  // Start new game
  const startGame = (duration: number) => {
    // Clear any existing recording
    clearRecording();

    setGameState({
      isPlaying: true,
      duration,
      startTime: Date.now(),
      endTime: null,
      stockPrice: 100,
      initialStockPrice: 100,
      currentSentiment: undefined,
      talkedAgents: new Set(),
    });

    // Generate new crowd with raised hands
    setCrowdMembers(generateCrowdMembers());
  };

  // Handle game end
  useEffect(() => {
    if (gameStatus === 'playing' && remainingTime <= 0) {
      // Stop any ongoing recording
      if (isRecording) {
        stopRecording();
      }

      // End the game
      setGameState((prev) => ({
        ...prev,
        isPlaying: false,
        endTime: Date.now(),
      }));
    }
  }, [gameStatus, remainingTime, isRecording, stopRecording, setGameState]);

  // Update timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTimerUpdate((n) => n + 1); // Increment timer update counter
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameStatus, setTimerUpdate]);

  // Show error if there's one
  if (error) {
    return (
      <div className='container mx-auto flex min-h-screen flex-col items-center justify-center p-4'>
        <div className='text-destructive'>{error}</div>
      </div>
    );
  }

  return (
    <div className='flex h-screen overflow-hidden'>
      {/* Main Content */}
      <div className='relative flex-1 p-8'>
        {/* Title and Game Info - Top */}
        <div className='absolute left-0 right-0 top-8 flex items-center justify-between px-8'>
          <h1 className='text-4xl font-bold tracking-tight'>PR Nightmare</h1>
          {gameStatus !== 'idle' && (
            <div className='flex items-center gap-4'>
              <Timer value={remainingTime} />
              <div className='text-xl font-semibold'>Stock: ${gameState.stockPrice.toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* Game Content */}
        <div className='flex h-full flex-col items-center justify-center gap-8'>
          {gameStatus === 'idle' ? (
            // Game Start Menu
            <div className='space-y-8 text-center'>
              <h2 className='text-2xl font-semibold'>Select Game Duration</h2>
              <div className='flex gap-4'>
                {GAME_DURATIONS.map((duration) => (
                  <Button
                    key={duration}
                    onClick={() => startGame(duration)}
                    variant='outline'
                    className='h-16 w-24 text-lg'
                  >
                    {duration}s
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            // Active Game or Results
            <div className='w-full space-y-8'>
              {/* Crowd Display - Only show during active game */}
              {gameStatus === 'playing' && (
                <div className='w-full max-w-4xl mx-auto'>
                  <Crowd
                    members={crowdMembers}
                    onMemberClick={handleCrowdMemberClick}
                    isRecording={isRecording}
                  />
                </div>
              )}

              {/* Recording Display */}
              {gameStatus === 'playing' && (
                <RecordingSection recording={recording} sentiment={gameState.currentSentiment} />
              )}

              {/* Game Over Screen */}
              {gameStatus === 'finished' && (
                <div className='text-center'>
                  <h2 className='text-2xl font-semibold'>Game Over!</h2>
                  <p className='mt-4 text-lg'>
                    Final Stock Price: ${gameState.stockPrice.toFixed(2)}
                  </p>
                  <Button
                    onClick={() => {
                      setGameState({
                        isPlaying: false,
                        duration: 60,
                        startTime: null,
                        endTime: null,
                        stockPrice: 100,
                        initialStockPrice: 100,
                        currentSentiment: undefined,
                        talkedAgents: new Set(),
                      });
                    }}
                    className='mt-8'
                  >
                    Play Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Control Panel - Bottom */}
        <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full border bg-background/95 px-6 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <MicrophoneSelector />
          {gameStatus === 'playing' && (
            <div className='w-48'>
              <PushToTalk
                isRecording={isRecording}
                startRecording={startRecording}
                stopRecording={stopRecording}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
