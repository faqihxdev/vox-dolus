'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { ChevronUp, Mic } from 'lucide-react';
import { useEffect } from 'react';

interface MicrophoneSelectorProps {
  disabled?: boolean;
}

export function MicrophoneSelector({ disabled }: MicrophoneSelectorProps) {
  const { devices, selectedDevice, setSelectedDevice, refreshDevices } = useAudioRecorder();

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  const selectedDeviceName =
    devices.find((d) => d.deviceId === selectedDevice)?.label || 'Select Microphone';

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <div className='relative'>
          <TooltipTrigger asChild>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    className='relative group h-10 w-10'
                    disabled={disabled}
                  >
                    <Mic className='h-4 w-4' />
                    <div className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-muted'>
                      <ChevronUp className='h-3 w-3 opacity-50 transition-transform group-data-[state=open]:rotate-180' />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='center' className='w-[200px]'>
                  {devices.map((device) => (
                    <DropdownMenuItem
                      key={device.deviceId}
                      onClick={() => setSelectedDevice(device.deviceId)}
                      className='gap-2'
                    >
                      <Mic className='h-4 w-4' />
                      <span className='truncate'>{device.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent side='top' align='center' className='mb-2'>
            <p className='text-sm'>{selectedDeviceName}</p>
          </TooltipContent>
        </div>
      </Tooltip>
    </TooltipProvider>
  );
}
