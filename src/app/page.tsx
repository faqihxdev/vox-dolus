'use client';

import { MicrophoneSelector } from '@/components/mic-selector';
import { PushToTalk } from '@/components/push-to-talk';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';

export default function Home() {
  const { recording, isRecording, error, startRecording, stopRecording } = useAudioRecorder();

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
        {/* Title - Top Center */}
        <div className='absolute left-1/2 top-8 -translate-x-1/2'>
          {/* <h1 className='text-5xl font-bold tracking-tight'>PR Nightmare</h1> */}
        </div>

        {/* Push to Talk and Recording */}
        <div className='flex h-full flex-col items-center justify-center gap-4'>
          <div className='w-full max-w-md space-y-4'>
            <PushToTalk
              isRecording={isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
            />

            {recording && (
              <div className='rounded-lg bg-muted p-4 shadow-sm'>
                <audio controls src={URL.createObjectURL(recording.blob)} className='w-full' />
              </div>
            )}
          </div>
        </div>

        {/* Control Panel - Bottom */}
        <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full border bg-background/95 px-6 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <MicrophoneSelector />
        </div>
      </div>
    </div>
  );
}
