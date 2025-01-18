'use client';

import { Game } from '@/actions/game';
import { Crowd } from '@/components/crowd';
import { MicrophoneSelector } from '@/components/mic-selector';
import { PushToTalk } from '@/components/push-to-talk';
import { StockChart } from '@/components/stock-chart';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { generateCrowdMembers, playAudioFromBase64, raiseRandomHands } from '@/lib/utils';
import { crowdMembersAtom, gameInstanceAtom, gameStateAtom, gameStatusAtom } from '@/stores';
import { CrowdMember } from '@/types';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export default function Home() {
  const { recording, isRecording, error, startRecording, stopRecording, clearRecording } =
    useAudioRecorder();
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [gameStatus] = useAtom(gameStatusAtom);
  const [crowdMembers, setCrowdMembers] = useAtom(crowdMembersAtom);
  const [gameInstance, setGameInstance] = useAtom(gameInstanceAtom);
  const [currentAudio, setCurrentAudio] = useState<{
    source: AudioBufferSourceNode;
    context: AudioContext;
  } | null>(null);

  // Add state for selected rounds
  const [selectedRounds, setSelectedRounds] = useState<number>(5);

  // Function to stop current audio
  const stopCurrentAudio = useCallback(() => {
    if (currentAudio) {
      try {
        currentAudio.source.stop();
        // Don't close the context, just stop the source
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
      setCurrentAudio(null);
    }
  }, [currentAudio]);

  // Handle game end
  const endGame = useCallback(() => {
    if (currentAudio) {
      stopCurrentAudio();
      // Only close the context when the game ends if it's not already closed
      try {
        if (currentAudio.context.state !== 'closed') {
          currentAudio.context.close();
        }
      } catch (error) {
        console.error('Error closing audio context:', error);
      }
    }
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      endTime: Date.now(),
    }));
  }, [setGameState, stopCurrentAudio, currentAudio]);

  // Price update effect with stock price check
  useEffect(() => {
    if (gameStatus !== 'playing' || !gameInstance) return;

    const interval = setInterval(() => {
      try {
        const newPrice = gameInstance.getNextPrice();
        setGameState((prev) => ({
          ...prev,
          stockPrice: newPrice,
        }));

        // End game if stock price is <= 0
        if (newPrice <= 0) {
          endGame();
        }
      } catch (error) {
        console.error('Error updating price:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, gameInstance, setGameState, endGame]);

  // Handle crowd member click with game instance integration
  const handleCrowdMemberClick = useCallback(
    async (member: CrowdMember) => {
      if (!member.hasQuestion || member.isTalking || !gameInstance) return;

      try {
        // Start conversation with the agent
        const response = await gameInstance.startSession(member.agentIdx);

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
          return {
            ...prev,
            talkedAgents: newTalkedAgents,
          };
        });

        // Play the agent's audio response
        if (response?.message?.audio?.data) {
          // Stop any currently playing audio before playing new one
          stopCurrentAudio();
          const audio = await playAudioFromBase64(response.message.audio.data);
          setCurrentAudio(audio);
        }
      } catch (error) {
        console.error('Error in crowd member interaction:', error);
      }
    },
    [gameInstance, setCrowdMembers, setGameState, stopCurrentAudio]
  );

  // Process recording with game instance integration
  useEffect(() => {
    if (recording?.base64 && gameStatus === 'playing' && gameInstance) {
      const handleResponse = async () => {
        try {
          const talkingMember = crowdMembers.find((m) => m.isTalking);
          if (!talkingMember) return;

          const response = await gameInstance.userTurn(talkingMember.agentIdx, recording.base64);

          clearRecording();

          if (response === null) {
            // Conversation ended - agent is satisfied
            setCrowdMembers((prev) =>
              prev.map((m) => ({
                ...m,
                isTalking: m.id === talkingMember.id ? false : m.isTalking,
              }))
            );

            // Check if this was the final round
            if (gameState.currentRound >= gameState.totalRounds) {
              endGame();
            } else {
              // Increment round counter if not the final round
              setGameState((prev) => ({
                ...prev,
                currentRound: prev.currentRound + 1,
              }));
              // Raise new hands after conversation ends
              setCrowdMembers((prev) => raiseRandomHands(prev, gameState.talkedAgents));
            }
          } else {
            // Play the agent's follow-up response
            if (response?.message?.audio?.data) {
              // Stop any currently playing audio before playing new one
              stopCurrentAudio();
              const audio = await playAudioFromBase64(response.message.audio.data);
              setCurrentAudio(audio);
            }
          }
        } catch (error) {
          console.error('Error processing recording:', error);
        }
      };

      handleResponse();
    }
  }, [
    recording,
    gameStatus,
    gameInstance,
    crowdMembers,
    gameState.talkedAgents,
    gameState.currentRound,
    gameState.totalRounds,
    setCrowdMembers,
    setGameState,
    clearRecording,
    endGame,
    stopCurrentAudio,
  ]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        stopCurrentAudio();
        // Close context on unmount if it's not already closed
        try {
          if (currentAudio.context.state !== 'closed') {
            currentAudio.context.close();
          }
        } catch (error) {
          console.error('Error closing audio context:', error);
        }
      }
    };
  }, [stopCurrentAudio, currentAudio]);

  // Start new game with game instance
  const startGame = useCallback(
    async (rounds: number) => {
      try {
        clearRecording();

        // Create new game instance with default values (will be updated after startGame call)
        const gameInstance = new Game();
        setGameInstance(gameInstance);

        // Initialize company details
        const companyDetails = await gameInstance.startGame();
        const initialPrice = companyDetails.initial_stock_price;

        setGameState({
          isPlaying: true,
          totalRounds: rounds,
          currentRound: 1,
          startTime: Date.now(),
          endTime: null,
          stockPrice: initialPrice,
          initialStockPrice: initialPrice,
          currentSentiment: undefined,
          talkedAgents: new Set(),
          companyName: companyDetails.company_name,
          companyBackground: companyDetails.company_background,
          ceoName: companyDetails.ceo_name,
          showWelcomeDialog: true,
        });

        setCrowdMembers(generateCrowdMembers());
      } catch (error) {
        console.error('Error starting game:', error);
      }
    },
    [setGameInstance, setGameState, setCrowdMembers, clearRecording]
  );

  // Handle welcome dialog close
  const handleWelcomeClose = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      showWelcomeDialog: false,
    }));
  }, [setGameState]);

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
          {gameStatus !== 'idle' && !gameState.showWelcomeDialog && (
            <div className='flex items-center gap-4'>
              <div className='text-xl font-semibold'>
                Round {gameState.currentRound} / {gameState.totalRounds}
              </div>
              <div className='text-xl font-semibold'>
                Stock: ${gameState.stockPrice?.toFixed(2) || 0}
              </div>
            </div>
          )}
        </div>

        {/* Game Content */}
        <div className='flex h-full flex-col items-center justify-center gap-8'>
          {gameStatus === 'idle' ? (
            // Game Start Menu
            <div className='space-y-8 text-center'>
              <h2 className='text-2xl font-semibold'>Select Number of Rounds</h2>
              <div className='flex flex-col items-center gap-6'>
                <Select
                  value={selectedRounds.toString()}
                  onValueChange={(value) => setSelectedRounds(parseInt(value))}
                >
                  <SelectTrigger className='w-48'>
                    <SelectValue placeholder='Select rounds' />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUND_OPTIONS.map((rounds) => (
                      <SelectItem key={rounds} value={rounds.toString()}>
                        {rounds} {rounds === 1 ? 'Round' : 'Rounds'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => startGame(selectedRounds)} size='lg' className='w-48'>
                  Start Game
                </Button>
              </div>
            </div>
          ) : (
            // Active Game or Results
            <div className='w-full space-y-8'>
              {/* Stock Chart - Only show during active game and after welcome dialog */}
              {gameStatus === 'playing' && !gameState.showWelcomeDialog && (
                <div className='w-full max-w-4xl mx-auto'>
                  <StockChart
                    initialPrice={gameState.initialStockPrice}
                    currentPrice={gameState.stockPrice}
                  />
                </div>
              )}

              {/* Crowd Display - Only show during active game */}
              {gameStatus === 'playing' && !gameState.showWelcomeDialog && (
                <div className='w-full max-w-4xl mx-auto'>
                  <Crowd
                    members={crowdMembers}
                    onMemberClick={handleCrowdMemberClick}
                    isRecording={isRecording}
                  />
                </div>
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
                        totalRounds: 5,
                        currentRound: 0,
                        startTime: null,
                        endTime: null,
                        stockPrice: 100,
                        initialStockPrice: 100,
                        currentSentiment: undefined,
                        talkedAgents: new Set(),
                        showWelcomeDialog: false,
                        companyName: '',
                        companyBackground: '',
                        ceoName: '',
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
          {gameStatus === 'playing' && !gameState.showWelcomeDialog && (
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

      {/* Welcome Dialog */}
      {gameState.showWelcomeDialog && (
        <WelcomeDialog
          isOpen={gameState.showWelcomeDialog}
          onClose={handleWelcomeClose}
          companyName={gameState.companyName || ''}
          companyBackground={gameState.companyBackground || ''}
          ceoName={gameState.ceoName || ''}
        />
      )}
    </div>
  );
}
