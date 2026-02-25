export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  requirement: {
    type: 'total_responses' | 'voice_responses' | 'streak' | 'sessions' | 'first_practice';
    count: number;
  };
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_practice',
    title: 'First Steps',
    description: 'Complete your first practice response',
    emoji: '🥇',
    color: '#F59E0B',
    requirement: { type: 'first_practice', count: 1 },
  },
  {
    id: 'streak_3',
    title: 'Getting Warm',
    description: 'Maintain a 3-day streak',
    emoji: '🔥',
    color: '#EF4444',
    requirement: { type: 'streak', count: 3 },
  },
  {
    id: 'streak_7',
    title: 'On Fire',
    description: 'Maintain a 7-day streak',
    emoji: '🔥',
    color: '#DC2626',
    requirement: { type: 'streak', count: 7 },
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    description: 'Maintain a 30-day streak',
    emoji: '💎',
    color: '#7C3AED',
    requirement: { type: 'streak', count: 30 },
  },
  {
    id: 'responses_10',
    title: 'Active Learner',
    description: 'Submit 10 responses',
    emoji: '📝',
    color: '#0F6B5E',
    requirement: { type: 'total_responses', count: 10 },
  },
  {
    id: 'responses_50',
    title: 'Knowledge Seeker',
    description: 'Submit 50 responses',
    emoji: '🧠',
    color: '#6366F1',
    requirement: { type: 'total_responses', count: 50 },
  },
  {
    id: 'responses_100',
    title: 'GD Champion',
    description: 'Submit 100 responses',
    emoji: '🏆',
    color: '#F59E0B',
    requirement: { type: 'total_responses', count: 100 },
  },
  {
    id: 'voice_5',
    title: 'Voice Pioneer',
    description: 'Submit 5 voice responses',
    emoji: '🎙️',
    color: '#E8734A',
    requirement: { type: 'voice_responses', count: 5 },
  },
  {
    id: 'voice_20',
    title: 'Voice Master',
    description: 'Submit 20 voice responses',
    emoji: '🎤',
    color: '#DC2626',
    requirement: { type: 'voice_responses', count: 20 },
  },
  {
    id: 'sessions_5',
    title: 'Explorer',
    description: 'Create 5 practice sessions',
    emoji: '🗺️',
    color: '#2563EB',
    requirement: { type: 'sessions', count: 5 },
  },
  {
    id: 'sessions_15',
    title: 'Dedicated Scholar',
    description: 'Create 15 practice sessions',
    emoji: '🎓',
    color: '#7C3AED',
    requirement: { type: 'sessions', count: 15 },
  },
];

export const XP_PER_RESPONSE = 15;
export const XP_PER_VOICE_RESPONSE = 25;
export const XP_PER_SESSION_CREATE = 10;
export const XP_PER_STREAK_DAY = 5;
export const XP_BADGE_BONUS = 50;

export function getLevelInfo(xp: number): { level: number; currentXp: number; xpForNext: number; progress: number } {
  let level = 1;
  let xpNeeded = 100;
  let remaining = xp;

  while (remaining >= xpNeeded) {
    remaining -= xpNeeded;
    level++;
    xpNeeded = Math.floor(100 * Math.pow(1.3, level - 1));
  }

  return {
    level,
    currentXp: remaining,
    xpForNext: xpNeeded,
    progress: remaining / xpNeeded,
  };
}

export function getLevelTitle(level: number): string {
  if (level <= 2) return 'Beginner';
  if (level <= 5) return 'Learner';
  if (level <= 8) return 'Speaker';
  if (level <= 12) return 'Debater';
  if (level <= 16) return 'Orator';
  if (level <= 20) return 'Rhetorician';
  return 'GD Legend';
}
