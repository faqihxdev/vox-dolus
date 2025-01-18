import { CrowdMember } from '@/types';
import { Hand } from 'lucide-react';
import Image from 'next/image';
import { CSSProperties, memo } from 'react';

interface CrowdProps {
  members: CrowdMember[];
  onMemberClick: (member: CrowdMember) => void;
  isRecording: boolean;
}

/**
 * 3 rows: Row1=10, Row2=12, Row3=8
 * - Everyone is horizontally centered with slight horizontal overlap
 *   (negative margin-left).
 * - If a member is talking => they shift up a bit & remain bright.
 * - If no one is talking and member hasQuestion => they shift up & remain bright.
 * - The rest become darkened with a filter.
 */
export const Crowd = memo(function Crowd({ members, onMemberClick, isRecording }: CrowdProps) {
  // 1) Split into 3 rows - total 30 members
  const row1 = members.slice(0, 10);
  const row2 = members.slice(10, 22);
  const row3 = members.slice(22, 30);

  // 2) Check if at least one is talking or hasQuestion
  const isSomeoneTalking = members.some((m) => m.isTalking);
  const isSomeoneQuestioning = members.some((m) => m.hasQuestion);

  // 3) Determine if we should darken
  //    If at least one talker or questioner, all others get darkened
  const shouldDarken = isSomeoneTalking || isSomeoneQuestioning;

  // 4) Avatar size & overlap
  const AVATAR_W = 100;
  const AVATAR_H = 100;
  // Each subsequent avatar overlaps the previous by half its width => 40px
  // We'll do that with negative margin-left on all but the first in each row.

  // 5) Decide styling for each member
  function getWrapperStyle(member: CrowdMember, indexInRow: number): CSSProperties {
    // Negative margin except for the first
    const marginLeft = indexInRow === 0 ? 0 : -(AVATAR_W / 2);

    // Raise up if talking, or if has question (but only if no one is talking)
    const isRaised = member.isTalking || (!isSomeoneTalking && member.hasQuestion);
    const translateY = isRaised ? -20 : 0; // shift up 20px if raised

    // If at least one is raised (talking or question), all non-raised get darkened
    // Use different brightness levels based on whether someone is talking
    let brightness = 'none';
    if (shouldDarken && !isRaised) {
      brightness = isSomeoneTalking ? 'brightness(0.2)' : 'brightness(0.4)';
    }

    return {
      width: AVATAR_W,
      height: AVATAR_H,
      flexShrink: 0,
      marginLeft,
      filter: brightness,
      transform: `translateY(${translateY}px)`,
      transition: 'transform 0.3s ease, filter 0.3s ease',
    };
  }

  // 6) Render an avatar
  function renderAvatar(member: CrowdMember, indexInRow: number) {
    // Determine if member is raised (same logic as in getWrapperStyle)
    const isRaised = member.isTalking || (!isSomeoneTalking && member.hasQuestion);

    return (
      <div key={member.id} style={getWrapperStyle(member, indexInRow)}>
        <div
          className={`relative w-full h-full rounded-full
            transition-all duration-300
            ${member.isTalking ? 'ring-4 ring-green-400' : 'ring-2 ring-transparent'}
          `}
        >
          <Image
            className='rounded-full'
            src={`/avatars/${parseInt(member.seed, 10)}.svg`}
            alt={member.name}
            fill
            sizes='100px'
            style={{ objectFit: 'contain' }}
          />

          {/* Hand button pinned to top-right of the avatar */}
          {member.hasQuestion && !member.isTalking && !isRecording && isRaised && (
            <button
              onClick={() => onMemberClick(member)}
              className='absolute bg-yellow-400 rounded-full p-2 hover:bg-yellow-500 transition-colors shadow-lg'
              style={{
                top: '-10px',
                right: '-10px',
                zIndex: 9999, // Much higher z-index to ensure it's above everything
              }}
            >
              <Hand className='w-5 h-5 text-white' />
            </button>
          )}

          {/* Optional speech bubble if talking */}
          {member.isTalking && (
            <div
              className='absolute -top-10 left-1/2 -translate-x-1/2
                bg-foreground text-background text-sm px-3 py-1 rounded-md shadow-md w-[150px]'
              style={{ zIndex: 1000 }}
            >
              <div className='font-semibold text-center'>{member.name}</div>
              <div className='text-xs opacity-80 text-center'>{member.network}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 7) Each row is absolutely positioned for vertical stacking
  //    We'll center them horizontally with `justify-content: center`.
  const rowContainerStyle = (bottom: number, zIndex: number): CSSProperties => ({
    position: 'absolute',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    bottom,
    zIndex,
  });

  // Helper: render a row of members
  function renderRow(rowMembers: CrowdMember[], bottom: number, zIndex: number) {
    return (
      <div style={rowContainerStyle(bottom, zIndex)}>
        {rowMembers.map((m, i) => renderAvatar(m, i))}
      </div>
    );
  }

  return (
    <div className='relative w-full h-[260px]' style={{ overflow: 'visible' }}>
      {/* Row1 (front, bottom) */}
      {renderRow(row1, 0, 3)}

      {/* Row2 (middle) */}
      {renderRow(row2, 70, 2)}

      {/* Row3 (top, back) */}
      {renderRow(row3, 150, 1)}
    </div>
  );
});
