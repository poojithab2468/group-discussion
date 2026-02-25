import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  BADGES,
  BadgeDefinition,
  XP_PER_RESPONSE,
  XP_PER_VOICE_RESPONSE,
  XP_PER_SESSION_CREATE,
  XP_PER_STREAK_DAY,
  XP_BADGE_BONUS,
  getLevelInfo,
} from '@/constants/gamification';

export interface GamificationState {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  totalResponses: number;
  voiceResponses: number;
  totalSessions: number;
  earnedBadgeIds: string[];
  weeklyActivity: Record<string, number>;
}

const GAMIFICATION_KEY = 'gd_gamification';

const DEFAULT_STATE: GamificationState = {
  xp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: null,
  totalResponses: 0,
  voiceResponses: 0,
  totalSessions: 0,
  earnedBadgeIds: [],
  weeklyActivity: {},
};

function getDateKey(date?: Date): string {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(d1: string, d2: string): number {
  const date1 = new Date(d1 + 'T00:00:00');
  const date2 = new Date(d2 + 'T00:00:00');
  return Math.floor(Math.abs(date2.getTime() - date1.getTime()) / 86400000);
}

export const [GamificationProvider, useGamification] = createContextHook(() => {
  const [state, setState] = useState<GamificationState>(DEFAULT_STATE);
  const [newBadge, setNewBadge] = useState<BadgeDefinition | null>(null);
  const queryClient = useQueryClient();

  const stateQuery = useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(GAMIFICATION_KEY);
      return stored ? (JSON.parse(stored) as GamificationState) : DEFAULT_STATE;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (updated: GamificationState) => {
      await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  useEffect(() => {
    if (stateQuery.data) {
      setState(stateQuery.data);
    }
  }, [stateQuery.data]);

  const checkAndAwardBadges = useCallback(
    (current: GamificationState): { updated: GamificationState; newlyEarned: BadgeDefinition | null } => {
      let newlyEarned: BadgeDefinition | null = null;
      const newBadgeIds = [...current.earnedBadgeIds];
      let bonusXp = 0;

      for (const badge of BADGES) {
        if (newBadgeIds.includes(badge.id)) continue;

        let earned = false;
        switch (badge.requirement.type) {
          case 'first_practice':
            earned = current.totalResponses >= badge.requirement.count;
            break;
          case 'total_responses':
            earned = current.totalResponses >= badge.requirement.count;
            break;
          case 'voice_responses':
            earned = current.voiceResponses >= badge.requirement.count;
            break;
          case 'streak':
            earned = current.currentStreak >= badge.requirement.count || current.longestStreak >= badge.requirement.count;
            break;
          case 'sessions':
            earned = current.totalSessions >= badge.requirement.count;
            break;
        }

        if (earned) {
          newBadgeIds.push(badge.id);
          bonusXp += XP_BADGE_BONUS;
          if (!newlyEarned) newlyEarned = badge;
        }
      }

      return {
        updated: { ...current, earnedBadgeIds: newBadgeIds, xp: current.xp + bonusXp },
        newlyEarned,
      };
    },
    []
  );

  const updateStreak = useCallback((current: GamificationState): GamificationState => {
    const today = getDateKey();
    const lastDate = current.lastPracticeDate;

    if (!lastDate) {
      return { ...current, currentStreak: 1, longestStreak: Math.max(1, current.longestStreak), lastPracticeDate: today };
    }

    if (lastDate === today) {
      return current;
    }

    const gap = daysBetween(lastDate, today);
    if (gap === 1) {
      const newStreak = current.currentStreak + 1;
      return {
        ...current,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, current.longestStreak),
        lastPracticeDate: today,
      };
    }

    return {
      ...current,
      currentStreak: 1,
      longestStreak: current.longestStreak,
      lastPracticeDate: today,
    };
  }, []);

  const recordResponse = useCallback(
    (isVoice: boolean) => {
      setState((prev) => {
        const xpGain = isVoice ? XP_PER_VOICE_RESPONSE : XP_PER_RESPONSE;
        const today = getDateKey();
        const weeklyActivity = { ...prev.weeklyActivity };
        weeklyActivity[today] = (weeklyActivity[today] ?? 0) + 1;

        let updated: GamificationState = {
          ...prev,
          xp: prev.xp + xpGain + XP_PER_STREAK_DAY,
          totalResponses: prev.totalResponses + 1,
          voiceResponses: isVoice ? prev.voiceResponses + 1 : prev.voiceResponses,
          weeklyActivity,
        };

        updated = updateStreak(updated);
        const { updated: withBadges, newlyEarned } = checkAndAwardBadges(updated);
        if (newlyEarned) {
          setNewBadge(newlyEarned);
        }

        syncMutation.mutate(withBadges);
        return withBadges;
      });
    },
    [updateStreak, checkAndAwardBadges, syncMutation]
  );

  const recordSessionCreate = useCallback(() => {
    setState((prev) => {
      const updated: GamificationState = {
        ...prev,
        xp: prev.xp + XP_PER_SESSION_CREATE,
        totalSessions: prev.totalSessions + 1,
      };
      const { updated: withBadges, newlyEarned } = checkAndAwardBadges(updated);
      if (newlyEarned) setNewBadge(newlyEarned);
      syncMutation.mutate(withBadges);
      return withBadges;
    });
  }, [checkAndAwardBadges, syncMutation]);

  const dismissBadge = useCallback(() => {
    setNewBadge(null);
  }, []);

  const levelInfo = useMemo(() => getLevelInfo(state.xp), [state.xp]);

  const earnedBadges = useMemo(
    () => BADGES.filter((b) => state.earnedBadgeIds.includes(b.id)),
    [state.earnedBadgeIds]
  );

  const weeklyCount = useMemo(() => {
    const now = new Date();
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      count += state.weeklyActivity[key] ?? 0;
    }
    return count;
  }, [state.weeklyActivity]);

  const weeklyDays = useMemo(() => {
    const now = new Date();
    const days: { key: string; label: string; count: number }[] = [];
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      days.push({
        key,
        label: dayLabels[d.getDay()],
        count: state.weeklyActivity[key] ?? 0,
      });
    }
    return days;
  }, [state.weeklyActivity]);

  const resetGamification = useCallback(async () => {
    setState(DEFAULT_STATE);
    await AsyncStorage.removeItem(GAMIFICATION_KEY);
    queryClient.invalidateQueries({ queryKey: ['gamification'] });
  }, [queryClient]);

  return {
    ...state,
    levelInfo,
    earnedBadges,
    newBadge,
    weeklyCount,
    weeklyDays,
    recordResponse,
    recordSessionCreate,
    dismissBadge,
    resetGamification,
    isLoading: stateQuery.isLoading,
  };
});
