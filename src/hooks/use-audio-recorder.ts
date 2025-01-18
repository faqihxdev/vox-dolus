import { useCallback, useEffect, useRef, useState } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface AudioRecording {
  base64: string;
  blob: Blob;
  timestamp: number;
}

/**
 * @description Custom hook for recording audio with device selection
 * @returns {Object} Recording controls and state
 */
export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordingChunks = useRef<Blob[]>([]);

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
      if (!selectedDevice && audioDevices.length > 0) {
        setSelectedDevice(audioDevices[0].deviceId);
      }
    } catch (err) {
      console.error('[useAudioRecorder]: Failed to load devices', err);
      setError('Failed to load audio devices');
    }
  }, [selectedDevice]);

  const startRecording = useCallback(async () => {
    try {
      if (!selectedDevice) {
        throw new Error('No microphone selected');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedDevice },
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
          setRecording({
            base64,
            blob,
            timestamp: Date.now(),
          });
        };
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
    }
  }, [selectedDevice]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorder.current) return;

    if (mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  }, []);

  const clearRecording = useCallback(() => {
    setRecording(null);
  }, []);

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
    isRecording,
    recording,
    error,
    devices,
    selectedDevice,
    setSelectedDevice,
    startRecording,
    stopRecording,
    clearRecording,
    refreshDevices,
  };
};
