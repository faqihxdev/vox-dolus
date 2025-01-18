import { CrowdMember } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to randomly raise hands
export const raiseRandomHands = (
  members: CrowdMember[],
  talkedAgents: Set<number>,
  count: number = 5
): CrowdMember[] => {
  // Reset all hands first
  const resetMembers = members.map((m) => ({ ...m, hasQuestion: false }));

  // Get available members (not talking and their agent type hasn't talked recently)
  const availableMembers = resetMembers.filter(
    (m) => !m.isTalking && !talkedAgents.has(m.agentIdx)
  );

  // If no available members, all agents have talked
  if (availableMembers.length === 0) {
    return resetMembers;
  }

  // Randomly select members to raise hands
  const shuffled = [...availableMembers].sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const member = shuffled[i];
    const index = resetMembers.findIndex((m) => m.id === member.id);
    if (index !== -1) {
      resetMembers[index].hasQuestion = true;
    }
  }

  return resetMembers;
};

// Generate 30 random crowd members with unique avatars
export const generateCrowdMembers = (): CrowdMember[] => {
  // Create array of available avatar numbers (1-30)
  const availableAvatars = Array.from({ length: 30 }, (_, i) => i + 1);

  // Shuffle the avatar numbers
  const shuffledAvatars = [...availableAvatars].sort(() => 0.5 - Math.random());

  const members = Array.from({ length: 30 }, (_, index) => {
    // Randomly select an agent index
    const agentIdx = Math.floor(Math.random() * GAME_AGENTS.length);
    const agent = GAME_AGENTS[agentIdx];

    return {
      id: uuidv4(),
      agentIdx,
      name: agent.name,
      network: agent.network,
      seed: shuffledAvatars[index].toString(), // Use the avatar number directly as seed
      hasQuestion: false,
      isTalking: false,
    };
  });

  return raiseRandomHands(members, new Set());
};

/**
 * @description List of agents
 */
export const GAME_AGENTS = [
  {
    name: 'Sophia Harrington',
    network: 'Global Update Network',
    persona:
      'An experienced investigative journalist known for her calm demeanor and in-depth analysis of complex international issues.',
    voice: 'alloy',
  },
  {
    name: 'James Carter',
    network: 'Continental News Service',
    persona:
      'A charismatic anchor who brings energy to breaking news stories, specializing in political and economic affairs.',
    voice: 'ash',
  },
  {
    name: 'Amara Lopez',
    network: 'WorldView Today',
    persona:
      'A passionate field reporter with a focus on humanitarian crises, often reporting directly from conflict zones.',
    voice: 'ballad',
  },
  {
    name: 'Liam Roberts',
    network: 'PrimeTime News',
    persona:
      'A reliable and composed evening news anchor, delivering stories with clarity and a touch of wit.',
    voice: 'echo',
  },
  {
    name: 'Elena Cho',
    network: '24/7 Current Affairs',
    persona:
      'A technology enthusiast who reports on the latest innovations, blending expertise with a down-to-earth approach.',
    voice: 'coral',
  },
  {
    name: 'Chloe Bennett',
    network: 'Daily Spotlight',
    persona:
      'An upbeat lifestyle reporter covering trends in fashion, health, and entertainment with a relatable charm.',
    voice: 'sage',
  },
  {
    name: "Sarah O'Connor",
    network: 'Pulse News Network',
    persona:
      'A gritty crime reporter who dives into the details of high-profile cases, earning respect for her fearless approach.',
    voice: 'verse',
  },
  {
    name: 'Aria Sullivan',
    network: 'Breaking Point Broadcast',
    persona:
      'An articulate and empathetic journalist specializing in social justice issues, known for giving a voice to underrepresented communities.',
    voice: 'shimmer',
  },
];
