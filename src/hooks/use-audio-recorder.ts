import { audioStateAtom } from '@/stores';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
}

/**
 * @description Custom hook for recording audio with device selection
 * @returns {Object} Recording controls and state
 */
export const useAudioRecorder = () => {
  const [audioState, setAudioState] = useAtom(audioStateAtom);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordingChunks = useRef<Blob[]>([]);
  const [devices, setDevices] = useState<AudioDevice[]>([]);

  // Load available audio devices
  const refreshDevices = useCallback(async () => {
    try {
      // Request permission first to get labeled devices
      await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => stream.getTracks().forEach((track) => track.stop()));

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
        }));

      setDevices(audioDevices);

      // Set default device if none selected
      if (!audioState.selectedDevice && audioDevices.length > 0) {
        setAudioState((prev) => ({ ...prev, selectedDevice: audioDevices[0].deviceId }));
      }
    } catch (err) {
      console.error('[useAudioRecorder]: Failed to load devices', err);
      setAudioState((prev) => ({ ...prev, error: 'Failed to load audio devices' }));
    }
  }, [audioState.selectedDevice, setAudioState]);

  const startRecording = useCallback(async () => {
    try {
      if (!audioState.selectedDevice) {
        throw new Error('No microphone selected');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: audioState.selectedDevice },
        },
      });

      mediaRecorder.current = new MediaRecorder(stream);
      recordingChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordingChunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(recordingChunks.current, { type: 'audio/wav' });
        recordingChunks.current = [];

        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAudioState((prev) => ({
            ...prev,
            currentRecording: {
              base64,
              blob,
              timestamp: Date.now(),
            },
            error: null,
          }));
        };
      };

      mediaRecorder.current.start();
      setAudioState((prev) => ({ ...prev, isRecording: true, error: null }));
    } catch (err) {
      setAudioState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to access microphone',
      }));
    }
  }, [audioState.selectedDevice, setAudioState]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorder.current) return;

    if (mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      setAudioState((prev) => ({ ...prev, isRecording: false }));
    }
  }, [setAudioState]);

  const clearRecording = useCallback(() => {
    setAudioState((prev) => ({ ...prev, currentRecording: null }));
  }, [setAudioState]);

  // Load devices on mount and when devices change
  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isRecording: audioState.isRecording,
    recording: audioState.currentRecording,
    error: audioState.error,
    devices,
    selectedDevice: audioState.selectedDevice,
    setSelectedDevice: (deviceId: string) =>
      setAudioState((prev) => ({ ...prev, selectedDevice: deviceId })),
    startRecording,
    stopRecording,
    clearRecording,
    refreshDevices,
  };
};
