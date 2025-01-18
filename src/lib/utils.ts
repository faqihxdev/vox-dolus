import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CrowdMember } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to randomly raise hands
export const raiseRandomHands = (members: CrowdMember[], count: number = 5): CrowdMember[] => {
    // Reset all hands first
    const resetMembers = members.map(m => ({ ...m, hasQuestion: false }));
    
    // Get available members (not talking)
    const availableMembers = resetMembers.filter(m => !m.isTalking);
    
    // Randomly select members to raise hands
    const shuffled = [...availableMembers].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const member = shuffled[i];
      const index = resetMembers.findIndex(m => m.id === member.id);
      if (index !== -1) {
        resetMembers[index].hasQuestion = true;
      }
    }
  
    return resetMembers;
  };

// Generate 15 random crowd members
export const generateCrowdMembers = (): CrowdMember[] => {
    const members = Array.from({ length: 15 }, () => ({
      id: uuidv4(),
      seed: Math.random().toString(36).substring(7),
      hasQuestion: false,
      isTalking: false,
    }));
  
    return raiseRandomHands(members);
  };