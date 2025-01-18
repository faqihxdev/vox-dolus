import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { gameStatusAtom } from '@/stores';
import { useAtom } from 'jotai';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function BackgroundMusic() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5); // 0.5 = 50% volume
  const [gameStatus] = useAtom(gameStatusAtom);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/bg.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    // Start playing when component mounts
    audioRef.current.play().catch((error) => {
      console.error('Error playing audio:', error);
    });

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [volume]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      // If game is playing, reduce volume by half
      audioRef.current.volume = gameStatus === 'playing' ? volume * 0.25 : volume;
    }
  }, [volume, gameStatus]);

  // Handle mute/unmute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='ghost'
        size='icon'
        className='w-9 px-0'
        onClick={toggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className='h-4 w-4' /> : <Volume2 className='h-4 w-4' />}
      </Button>
      <Slider
        className='w-24'
        value={[volume]}
        onValueChange={([newVolume]) => setVolume(newVolume)}
        min={0}
        max={1}
        step={0.01}
      />
      <pre>{JSON.stringify(audioRef.current?.volume, null, 2)}</pre>
    </div>
  );
}
