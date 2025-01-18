import { memo } from 'react';

/**
 * @description Timer component that displays remaining time in MM:SS format
 */
export const Timer = memo(function Timer({ value }: { value: number }) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;

  return (
    <div className="font-mono text-2xl font-bold tabular-nums">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}); 