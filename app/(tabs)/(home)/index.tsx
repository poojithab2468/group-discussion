import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  Plus,
  Clock,
  ChevronRight,
  MessageSquare,
  Users,
  Mic,
  Type,
  Trash2,
  Zap,
  TrendingUp,
  Flame,
  Trophy,
  Star,
  Quote,
} from 'lucide-react-native';
import { useSessions } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import Colors from '@/constants/colors';
import { CATEGORY_CONFIG, SessionCategory } from '@/types/session';
import { getLevelTitle } from '@/constants/gamification';
import { getDailyQuote } from '@/constants/quotes';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function StreakCircle({ streak, longestStreak }: { streak: number; longestStreak: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (streak >= 3) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [streak]);

  return (
    <Animated.View style={[styles.streakCircle, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.streakInner}>
        <Flame size={20} color={streak > 0 ? Colors.light.streak : Colors.light.textSecondary} />
        <Text style={[styles.streakNumber, streak > 0 && { color: Colors.light.streak }]}>{streak}</Text>
        <Text style={styles.streakLabel}>day{streak !== 1 ? 's' : ''}</Text>
      </View>
      {streak >= 3 && (
        <Animated.View style={[styles.streakGlow, { opacity: glowAnim }]} />
      )}
    </Animated.View>
  );
}

function XPProgressBar({ progress, level, currentXp, xpForNext }: { progress: number; level: number; currentXp: number; xpForNext: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.xpSection}>
      <View style={styles.xpHeader}>
        <View style={styles.levelBadge}>
          <Star size={12} color={Colors.light.level} />
          <Text style={styles.levelText}>Lv. {level}</Text>
        </View>
        <Text style={styles.xpText}>{currentXp} / {xpForNext} XP</Text>
      </View>
      <View style={styles.xpBarBg}>
        <Animated.View
          style={[
            styles.xpBarFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

function WeeklyChart({ days }: { days: { key: string; label: string; count: number }[] }) {
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <View style={styles.weeklyChart}>
      {days.map((day) => (
        <View key={day.key} style={styles.weeklyDay}>
          <View style={styles.weeklyBarBg}>
            <View
              style={[
                styles.weeklyBarFill,
                {
                  height: `${Math.max((day.count / maxCount) * 100, day.count > 0 ? 15 : 0)}%`,
                  backgroundColor: day.count > 0 ? Colors.light.tint : 'transparent',
                },
              ]}
            />
          </View>
          <Text style={[styles.weeklyLabel, day.count > 0 && styles.weeklyLabelActive]}>
            {day.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function AnimatedSessionCard({
  session,
  index,
  onPress,
  onDelete,
}: {
  session: {
    id: string;
    title: string;
    topic: string;
    category: SessionCategory;
    entries: { inputMode?: string; analysis?: string | null }[];
    lastPracticedAt: string | null;
  };
  index: number;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [index]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const config = CATEGORY_CONFIG[session.category];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not practiced';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Animated.View
      style={{
        opacity: cardAnim,
        transform: [
          { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => onPress(session.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={`session-card-${index}`}
      >
        <View style={styles.sessionTop}>
          <View style={styles.sessionLeft}>
            <View style={[styles.sessionEmoji, { backgroundColor: config.color + '12' }]}>
              <Text style={styles.emojiText}>{config.emoji}</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
              <View style={[styles.categoryTag, { backgroundColor: config.color + '14' }]}>
                <View style={[styles.catDot, { backgroundColor: config.color }]} />
                <Text style={[styles.categoryTagText, { color: config.color }]}>{config.label}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(session.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={14} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        {session.topic ? (
          <Text style={styles.topicText} numberOfLines={2}>{session.topic}</Text>
        ) : null}
        <View style={styles.sessionBottom}>
          <View style={styles.metaItem}>
            <MessageSquare size={11} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{session.entries.length} responses</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Clock size={11} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{formatDate(session.lastPracticedAt)}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.arrowCircle}>
            <ChevronRight size={14} color={Colors.light.tint} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { sessions, isLoading, deleteSession } = useSessions();
  const { user } = useAuth();
  const gamification = useGamification();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;

  const dailyQuote = useMemo(() => getDailyQuote(), []);

  useEffect(() => {
    if (gamification.newBadge) {
      router.push('/badge-unlock' as never);
    }
  }, [gamification.newBadge]);

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
      ]),
      Animated.timing(statsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(fabAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleCreateSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create-session' as never);
  };

  const handleSessionPress = (sessionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/practice/${sessionId}` as never);
  };

  const handleDeleteSession = (sessionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const doDelete = () => {
      deleteSession(sessionId);
      console.log('[HomeScreen] Session deleted:', sessionId);
    };
    if (Platform.OS === 'web') {
      if (confirm('Delete this GD session? This cannot be undone.')) doDelete();
    } else {
      Alert.alert('Delete Session', 'This will remove the session and all its responses.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (isLoading || gamification.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  const levelTitle = getLevelTitle(gamification.levelInfo.level);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.greetingSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingText}>
              {getGreeting()}, {user?.name?.split(' ')[0] ?? 'there'} 👋
            </Text>
            <View style={styles.levelRow}>
              <View style={styles.levelPill}>
                <Star size={11} color={Colors.light.level} />
                <Text style={styles.levelPillText}>{levelTitle}</Text>
              </View>
              <Text style={styles.xpTotal}>{gamification.xp} XP</Text>
            </View>
          </View>
          <View style={styles.greetingRight}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{user?.avatarEmoji ?? '😊'}</Text>
            </View>
          </View>
        </Animated.View>

        {gamification.currentStreak >= 3 && (
          <Animated.View style={[styles.fireCard, { opacity: fadeAnim }]}>
            <View style={styles.fireCardInner}>
              <Text style={styles.fireEmoji}>🔥</Text>
              <View style={styles.fireTextWrap}>
                <Text style={styles.fireTitle}>You're on fire!</Text>
                <Text style={styles.fireSubtitle}>{gamification.currentStreak}-day streak! Keep going!</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View style={[styles.gamificationRow, { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.streakCard}>
            <StreakCircle streak={gamification.currentStreak} longestStreak={gamification.longestStreak} />
            <View style={styles.streakMeta}>
              <Text style={styles.streakMetaLabel}>Best: {gamification.longestStreak}d</Text>
            </View>
          </View>

          <View style={styles.xpCard}>
            <XPProgressBar
              progress={gamification.levelInfo.progress}
              level={gamification.levelInfo.level}
              currentXp={gamification.levelInfo.currentXp}
              xpForNext={gamification.levelInfo.xpForNext}
            />
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <MessageSquare size={12} color={Colors.light.tint} />
                <Text style={styles.quickStatValue}>{gamification.totalResponses}</Text>
              </View>
              <View style={styles.quickStat}>
                <Mic size={12} color={Colors.light.accent} />
                <Text style={styles.quickStatValue}>{gamification.voiceResponses}</Text>
              </View>
              <View style={styles.quickStat}>
                <Trophy size={12} color={Colors.light.badge} />
                <Text style={styles.quickStatValue}>{gamification.earnedBadges.length}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.weeklyCard, { opacity: statsAnim }]}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyTitle}>This Week</Text>
            <Text style={styles.weeklyCount}>{gamification.weeklyCount} responses</Text>
          </View>
          <WeeklyChart days={gamification.weeklyDays} />
        </Animated.View>

        <View style={styles.quoteCard}>
          <View style={styles.quoteIcon}>
            <Quote size={14} color={Colors.light.gold} />
          </View>
          <Text style={styles.quoteText}>"{dailyQuote.text}"</Text>
          <Text style={styles.quoteAuthor}>— {dailyQuote.author}</Text>
        </View>

        <TouchableOpacity
          style={styles.createBanner}
          onPress={handleCreateSession}
          activeOpacity={0.85}
          testID="create-session-hero"
        >
          <View style={styles.bannerPattern}>
            <View style={styles.bannerCircle1} />
            <View style={styles.bannerCircle2} />
          </View>
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconWrap}>
              <Users size={20} color="#FFFFFF" />
            </View>
            <View style={styles.bannerTextWrap}>
              <Text style={styles.bannerTitle}>Start GD Practice</Text>
              <Text style={styles.bannerSubtitle}>Create a new session & earn XP</Text>
            </View>
          </View>
          <View style={styles.bannerBtn}>
            <Plus size={18} color={Colors.light.dark} />
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Sessions</Text>
          {sessions.length > 0 && (
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCount}>{sessions.length}</Text>
            </View>
          )}
        </View>

        {sessions.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyIconContainer}>
              <View style={styles.emptyInnerCircle}>
                <Users size={32} color={Colors.light.tint} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyText}>
              Create your first GD session to start practicing
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateSession} activeOpacity={0.85}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create Session</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          sessions.map((session, index) => (
            <AnimatedSessionCard
              key={session.id}
              session={session}
              index={index}
              onPress={handleSessionPress}
              onDelete={handleDeleteSession}
            />
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {sessions.length > 0 && (
        <Animated.View
          style={[
            styles.fab,
            { transform: [{ scale: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }] },
          ]}
        >
          <TouchableOpacity style={styles.fabButton} onPress={handleCreateSession} activeOpacity={0.85}>
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background },

  greetingSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greetingLeft: { flex: 1 },
  greetingText: { fontSize: 22, fontWeight: '800' as const, color: Colors.light.text, letterSpacing: -0.3, marginBottom: 6 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.light.levelLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  levelPillText: { fontSize: 12, fontWeight: '700' as const, color: Colors.light.level },
  xpTotal: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.xp },
  greetingRight: {},
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.light.tintLight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.light.tint + '20' },
  avatarEmoji: { fontSize: 24 },

  fireCard: {
    backgroundColor: Colors.light.streakLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.streak + '20',
  },
  fireCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fireEmoji: { fontSize: 28 },
  fireTextWrap: { flex: 1 },
  fireTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.light.streak },
  fireSubtitle: { fontSize: 13, color: Colors.light.text, marginTop: 2 },

  gamificationRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  streakCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    width: 100,
  },
  streakCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.light.streakLight, justifyContent: 'center', alignItems: 'center', marginBottom: 6, position: 'relative' },
  streakInner: { alignItems: 'center' },
  streakNumber: { fontSize: 18, fontWeight: '800' as const, color: Colors.light.textSecondary, marginTop: -2 },
  streakLabel: { fontSize: 9, color: Colors.light.textSecondary, fontWeight: '600' as const },
  streakGlow: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: 36, borderWidth: 2, borderColor: Colors.light.streak + '30' },
  streakMeta: { alignItems: 'center' },
  streakMetaLabel: { fontSize: 11, color: Colors.light.textSecondary, fontWeight: '500' as const },

  xpCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    justifyContent: 'space-between',
  },
  xpSection: {},
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelText: { fontSize: 14, fontWeight: '800' as const, color: Colors.light.level },
  xpText: { fontSize: 12, color: Colors.light.textSecondary, fontWeight: '500' as const },
  xpBarBg: { height: 8, backgroundColor: Colors.light.xpLight, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: Colors.light.xp, borderRadius: 4 },
  quickStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  quickStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quickStatValue: { fontSize: 14, fontWeight: '700' as const, color: Colors.light.text },

  weeklyCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  weeklyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  weeklyTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.light.text },
  weeklyCount: { fontSize: 12, color: Colors.light.textSecondary, fontWeight: '500' as const },
  weeklyChart: { flexDirection: 'row', justifyContent: 'space-around', height: 60 },
  weeklyDay: { alignItems: 'center', flex: 1, gap: 4 },
  weeklyBarBg: { flex: 1, width: 20, backgroundColor: Colors.light.background, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  weeklyBarFill: { width: '100%', borderRadius: 6, minHeight: 0 },
  weeklyLabel: { fontSize: 10, color: Colors.light.textSecondary, fontWeight: '600' as const },
  weeklyLabelActive: { color: Colors.light.tint },

  quoteCard: {
    backgroundColor: Colors.light.goldLight,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.gold + '15',
  },
  quoteIcon: { marginBottom: 8 },
  quoteText: { fontSize: 14, color: Colors.light.text, lineHeight: 22, fontStyle: 'italic' as const, marginBottom: 8 },
  quoteAuthor: { fontSize: 12, color: Colors.light.textSecondary, fontWeight: '600' as const },

  createBanner: {
    backgroundColor: Colors.light.dark,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  bannerPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bannerCircle1: { position: 'absolute', top: -20, right: -10, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)' },
  bannerCircle2: { position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.03)' },
  bannerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  bannerIconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF', marginBottom: 2 },
  bannerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  bannerBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.light.gold, justifyContent: 'center', alignItems: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.light.text, letterSpacing: -0.3 },
  sectionCountBadge: { backgroundColor: Colors.light.tintLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  sectionCount: { fontSize: 12, color: Colors.light.tint, fontWeight: '700' as const },

  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIconContainer: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.light.tintLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyInnerCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.light.surface, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.light.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 21, maxWidth: 280, marginBottom: 24 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.tint, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, gap: 7 },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '700' as const, fontSize: 15 },

  sessionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  sessionEmoji: { width: 46, height: 46, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emojiText: { fontSize: 22 },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.light.text, marginBottom: 5, letterSpacing: -0.2 },
  categoryTag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 5 },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  categoryTagText: { fontSize: 11, fontWeight: '600' as const },
  deleteBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.light.background, justifyContent: 'center', alignItems: 'center' },
  topicText: { fontSize: 13, color: Colors.light.textSecondary, lineHeight: 19, marginBottom: 12, fontStyle: 'italic' as const },
  sessionBottom: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.light.borderLight },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.light.textSecondary },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.light.textSecondary, marginHorizontal: 8, opacity: 0.4 },
  arrowCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.light.tintLight, justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', bottom: 20, right: 20 },
  fabButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.light.tint, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  bottomSpacer: { height: 90 },
});
