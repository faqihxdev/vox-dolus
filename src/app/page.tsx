'use client';

import { useAtom } from 'jotai';
import { useEffect, memo, useCallback } from 'react';
import { MicrophoneSelector } from '@/components/mic-selector';
import { PushToTalk } from '@/components/push-to-talk';
import { AudioPlayer } from '@/components/audio-player';
import { Crowd } from '@/components/crowd';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { gameStateAtom, remainingTimeAtom, gameStatusAtom, timerUpdateAtom, crowdMembersAtom, raiseRandomHands } from '@/stores';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/timer';
import { processAudio } from '@/actions/process-audio';
import { CrowdMember } from '@/types';
import { Separator } from '@/components/ui/separator';

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
        <div className={`text-lg font-medium ${
          sentiment > 0 ? 'text-green-600' : 
          sentiment < 0 ? 'text-red-600' : 
          'text-yellow-600'
        }`}>
          Sentiment: {sentiment > 0 ? '+' : ''}{sentiment}
        </div>
      )}
    </div>
  );
});

export default function Home() {
  const { recording, isRecording, error, startRecording, stopRecording, clearRecording } = useAudioRecorder();
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [remainingTime] = useAtom(remainingTimeAtom);
  const [gameStatus] = useAtom(gameStatusAtom);
  const [, setTimerUpdate] = useAtom(timerUpdateAtom);
  const [crowdMembers, setCrowdMembers] = useAtom(crowdMembersAtom);

  // Handle crowd member click
  const handleCrowdMemberClick = useCallback((member: CrowdMember) => {
    if (!member.hasQuestion || member.isTalking) return;

    // Update member state
    setCrowdMembers(prev => prev.map(m => ({
      ...m,
      hasQuestion: m.id === member.id ? false : m.hasQuestion,
      isTalking: m.id === member.id
    })));

    // After 3 seconds, stop talking and raise new hands
    setTimeout(() => {
      setCrowdMembers(prev => raiseRandomHands(prev.map(m => ({
        ...m,
        isTalking: m.id === member.id ? false : m.isTalking
      }))));
    }, 3000);
  }, [setCrowdMembers]);

  // Process recording when it changes
  useEffect(() => {
    if (recording?.base64 && gameStatus === 'playing') {
      processAudio(recording.base64).then(({ sentiment }) => {
        setGameState(prev => ({
          ...prev,
          currentSentiment: sentiment,
          // Update stock price based on sentiment
          stockPrice: prev.stockPrice * (1 + sentiment * 0.1), // 10% max impact
        }));

        // After processing audio, raise new hands
        setCrowdMembers(prev => raiseRandomHands(prev));
      });
    }
  }, [recording, gameStatus, setGameState, setCrowdMembers]);

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
    });
  };

  // Handle game end
  useEffect(() => {
    if (gameStatus === 'playing' && remainingTime <= 0) {
      // Stop any ongoing recording
      if (isRecording) {
        stopRecording();
      }
      
      // End the game
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        endTime: Date.now()
      }));
    }
  }, [gameStatus, remainingTime, isRecording, stopRecording, setGameState]);

  // Update timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTimerUpdate(n => n + 1); // Increment timer update counter
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
              <div className='text-xl font-semibold'>
                Stock: ${gameState.stockPrice.toFixed(2)}
              </div>
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
            <div className='w-full max-w-xl space-y-8'>
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
                <RecordingSection
                  recording={recording}
                  sentiment={gameState.currentSentiment}
                />
              )}

              {/* Game Over Screen */}
              {gameStatus === 'finished' && (
                <div className='text-center'>
                  <h2 className='text-2xl font-semibold'>Game Over!</h2>
                  <p className='mt-4 text-lg'>
                    Final Stock Price: ${gameState.stockPrice.toFixed(2)}
                  </p>
                  <Button
                    onClick={() => setGameState(prev => ({ 
                      ...prev, 
                      isPlaying: false, 
                      startTime: null,
                      endTime: null,
                      currentSentiment: undefined,
                    }))}
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
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className='w-48'>
                <PushToTalk
                  isRecording={isRecording}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
