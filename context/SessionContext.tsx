import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { PracticeSession, PracticeEntry } from '@/types/session';

const STORAGE_KEY = 'gd_practice_sessions';

export const [SessionProvider, useSessions] = createContextHook(() => {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as PracticeSession[]) : [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (updated: PracticeSession[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  useEffect(() => {
    if (sessionsQuery.data) {
      setSessions(sessionsQuery.data);
    }
  }, [sessionsQuery.data]);

  const addSession = useCallback((session: PracticeSession) => {
    setSessions((prev) => {
      const updated = [session, ...prev];
      syncMutation.mutate(updated);
      return updated;
    });
  }, [syncMutation]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      syncMutation.mutate(updated);
      return updated;
    });
  }, [syncMutation]);

  const addEntry = useCallback((sessionId: string, entry: PracticeEntry) => {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              entries: [entry, ...s.entries],
              lastPracticedAt: new Date().toISOString(),
            }
          : s
      );
      syncMutation.mutate(updated);
      return updated;
    });
  }, [syncMutation]);

  const updateEntryAnalysis = useCallback((sessionId: string, entryId: string, analysis: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              entries: s.entries.map((e) =>
                e.id === entryId ? { ...e, analysis } : e
              ),
            }
          : s
      );
      syncMutation.mutate(updated);
      return updated;
    });
  }, [syncMutation]);

  const deleteEntry = useCallback((sessionId: string, entryId: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId
          ? { ...s, entries: s.entries.filter((e) => e.id !== entryId) }
          : s
      );
      syncMutation.mutate(updated);
      return updated;
    });
  }, [syncMutation]);

  const getSession = useCallback(
    (id: string) => sessions.find((s) => s.id === id) ?? null,
    [sessions]
  );

  return {
    sessions,
    isLoading: sessionsQuery.isLoading,
    addSession,
    deleteSession,
    addEntry,
    updateEntryAnalysis,
    deleteEntry,
    getSession,
  };
});
