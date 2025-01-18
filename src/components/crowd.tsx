import { memo } from 'react';
import { CrowdMember } from '@/types';
import Image from 'next/image';
import { Hand } from 'lucide-react';

interface CrowdProps {
  members: CrowdMember[];
  onMemberClick: (member: CrowdMember) => void;
  isRecording: boolean;
}

/**
 * @description Crowd component that displays Dicebear avatars in a grid with hand emojis
 */
export const Crowd = memo(function Crowd({ members, onMemberClick, isRecording }: CrowdProps) {
  // Check if any member is currently talking
  const isSomeoneTalking = members.some(m => m.isTalking);

  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="relative"
        >
          {/* Avatar Container */}
          <div
            className={`relative aspect-square rounded-full overflow-hidden transition-transform hover:scale-110 ${
              member.isTalking ? 'ring-2 ring-green-400' : ''
            }`}
          >
            <Image
              src={`https://api.dicebear.com/7.x/personas/svg?seed=${member.seed}`}
              alt="Crowd member"
              width={100}
              height={100}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Hand Icon - Hidden when recording, someone is talking, or this member is talking */}
          {member.hasQuestion && !isRecording && !isSomeoneTalking && !member.isTalking && (
            <button
              onClick={() => onMemberClick(member)}
              className="absolute -top-4 -right-2 bg-yellow-400 rounded-full p-1.5 hover:bg-yellow-500 transition-colors"
            >
              <Hand className="w-4 h-4 text-white" />
            </button>
          )}

          {/* Speech Bubble */}
          {member.isTalking && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background rounded-lg px-3 py-1 shadow-lg text-sm text-foreground">
              Hi! {member.id.slice(0, 4)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
