import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

interface PushToTalkProps {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

/**
 * @description Push to talk component that handles recording audio
 */
export const PushToTalk = ({ isRecording, startRecording, stopRecording }: PushToTalkProps) => {
  const isMouseDownRef = useRef(false);

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

  // Handle mouse events
  const handleMouseDown = useCallback(async () => {
    if (!isRecording && !isMouseDownRef.current) {
      isMouseDownRef.current = true;
      await startRecording();
    }
  }, [isRecording, startRecording]);

  const handleMouseUp = useCallback(() => {
    if (isRecording && isMouseDownRef.current) {
      isMouseDownRef.current = false;
      stopRecording();
    }
  }, [isRecording, stopRecording]);

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
    <div className='relative'>
      <Button
        size='lg'
        variant={isRecording ? 'destructive' : 'default'}
        className='w-full gap-2 font-semibold text-lg'
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {isRecording ? (
          <>
            <MicOff className='h-6 w-6' />
            <span>Recording...</span>
          </>
        ) : (
          <>
            <Mic className='h-6 w-6' />
            <span>Record</span>
          </>
        )}
      </Button>
    </div>
  );
};
