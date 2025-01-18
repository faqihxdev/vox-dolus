import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useCallback, useEffect } from 'react';

interface PushToTalkProps {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

/**
 * @description Push to talk component that handles recording audio
 */
export const PushToTalk = ({ isRecording, startRecording, stopRecording }: PushToTalkProps) => {
  // Handle spacebar press
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isRecording) {
        e.preventDefault();
        startRecording();
      }
    },
    [isRecording, startRecording]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopRecording();
      }
    },
    [isRecording, stopRecording]
  );

  // Setup keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <Button
      size='lg'
      variant={isRecording ? 'destructive' : 'default'}
      className='w-full gap-2'
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onMouseLeave={isRecording ? stopRecording : undefined}
    >
      {isRecording ? (
        <>
          <MicOff className='h-5 w-5' />
          Recording...
        </>
      ) : (
        <>
          <Mic className='h-5 w-5' />
          Record
        </>
      )}
    </Button>
  );
};
