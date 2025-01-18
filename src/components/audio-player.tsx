import { memo, useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
  blob: Blob;
}

/**
 * @description Memoized audio player component for recordings
 */
export const AudioPlayer = memo(function AudioPlayer({ blob }: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string>();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Create URL for the blob immediately
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);

    // Reset audio element when URL changes
    if (audioRef.current) {
      audioRef.current.load();
    }

    // Cleanup URL when component unmounts or blob changes
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  return (
    <div className='w-full max-w-md rounded-lg bg-muted p-4 shadow-sm'>
      <audio ref={audioRef} controls src={audioUrl} className='w-full' />
    </div>
  );
});
