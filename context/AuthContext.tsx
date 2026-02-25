import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  avatarEmoji: string;
}

const AUTH_STORAGE_KEY = 'gd_auth_user';
const ONBOARDING_KEY = 'gd_onboarding_done';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['auth_user'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as UserProfile) : null;
    },
  });

  const onboardingQuery = useQuery({
    queryKey: ['onboarding_status'],
    queryFn: async () => {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      return done === 'true';
    },
  });

  const authMutation = useMutation({
    mutationFn: async (profile: UserProfile | null) => {
      if (profile) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth_user'] });
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding_status'] });
    },
  });

  useEffect(() => {
    if (userQuery.data !== undefined) {
      setUser(userQuery.data);
    }
  }, [userQuery.data]);

  useEffect(() => {
    if (onboardingQuery.data !== undefined) {
      setHasSeenOnboarding(onboardingQuery.data);
    }
  }, [onboardingQuery.data]);

  const signUp = useCallback(
    (name: string, email: string, _password: string) => {
      const profile: UserProfile = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        name,
        email: email.toLowerCase().trim(),
        createdAt: new Date().toISOString(),
        avatarEmoji: ['😊', '🚀', '🎯', '💡', '🌟', '🎓'][Math.floor(Math.random() * 6)],
      };
      setUser(profile);
      authMutation.mutate(profile);
      console.log('[Auth] User signed up:', profile.id);
    },
    [authMutation]
  );

  const signIn = useCallback(
    (email: string, _password: string): boolean => {
      if (user && user.email === email.toLowerCase().trim()) {
        console.log('[Auth] User signed in (existing):', user.id);
        return true;
      }
      const profile: UserProfile = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        name: email.split('@')[0],
        email: email.toLowerCase().trim(),
        createdAt: new Date().toISOString(),
        avatarEmoji: '😊',
      };
      setUser(profile);
      authMutation.mutate(profile);
      console.log('[Auth] User signed in (new):', profile.id);
      return true;
    },
    [user, authMutation]
  );

  const signOut = useCallback(() => {
    setUser(null);
    authMutation.mutate(null);
    console.log('[Auth] User signed out');
  }, [authMutation]);

  const completeOnboarding = useCallback(() => {
    setHasSeenOnboarding(true);
    onboardingMutation.mutate();
  }, [onboardingMutation]);

  const updateProfile = useCallback(
    (updates: Partial<Pick<UserProfile, 'name' | 'avatarEmoji'>>) => {
      if (!user) return;
      const updated = { ...user, ...updates };
      setUser(updated);
      authMutation.mutate(updated);
    },
    [user, authMutation]
  );

  const isLoading = userQuery.isLoading || onboardingQuery.isLoading;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    hasSeenOnboarding,
    signUp,
    signIn,
    signOut,
    completeOnboarding,
    updateProfile,
  };
});
