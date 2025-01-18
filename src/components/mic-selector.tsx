'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { Check, Mic } from 'lucide-react';
import { useEffect } from 'react';

interface MicrophoneSelectorProps {
  disabled?: boolean;
}

export function MicrophoneSelector({ disabled }: MicrophoneSelectorProps) {
  const { devices, selectedDevice, setSelectedDevice, refreshDevices } = useAudioRecorder();

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className='h-10 w-10 bg-muted border-primary/20 hover:border-primary/40 transition-colors duration-300'
          disabled={disabled}
        >
          <Mic className='h-4 w-4 text-primary' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='center'
        className='w-64 bg-popover border-primary/20 backdrop-blur-sm'
      >
        {devices.map((device) => (
          <DropdownMenuItem
            key={device.deviceId}
            onClick={() => setSelectedDevice(device.deviceId)}
            className='flex items-center gap-2 hover:bg-muted transition-colors duration-200'
          >
            {device.deviceId === selectedDevice && <Check className='h-4 w-4 mr-2 text-primary' />}
            <span className='truncate text-sm'>{device.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
