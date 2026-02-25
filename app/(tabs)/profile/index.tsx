import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import {
  LogOut,
  Edit3,
  Award,
  Flame,
  Star,
  MessageSquare,
  Mic,
  TrendingUp,
  ChevronRight,
  Check,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { getLevelTitle } from '@/constants/gamification';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const AVATAR_EMOJIS = ['😊', '🚀', '🎯', '💡', '🌟', '🎓', '🦊', '🐱', '🦁', '🐸', '🌺', '⚡'];

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const gamification = useGamification();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const levelTitle = getLevelTitle(gamification.levelInfo.level);

  const handleSignOut = () => {
    const doSignOut = () => {
      signOut();
      router.replace('/auth' as never);
    };
    if (Platform.OS === 'web') {
      if (confirm('Sign out of your account?')) doSignOut();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doSignOut },
      ]);
    }
  };

  const handleSaveName = () => {
    if (editName.trim()) {
      updateProfile({ name: editName.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsEditingName(false);
  };

  const handleSelectEmoji = (emoji: string) => {
    updateProfile({ avatarEmoji: emoji });
    setShowEmojiPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const stats = [
    { icon: MessageSquare, label: 'Total Responses', value: gamification.totalResponses, color: Colors.light.tint },
    { icon: Mic, label: 'Voice Responses', value: gamification.voiceResponses, color: Colors.light.accent },
    { icon: Flame, label: 'Current Streak', value: `${gamification.currentStreak}d`, color: Colors.light.streak },
    { icon: TrendingUp, label: 'Longest Streak', value: `${gamification.longestStreak}d`, color: Colors.light.xp },
    { icon: Award, label: 'Badges Earned', value: gamification.earnedBadges.length, color: Colors.light.badge },
    { icon: Star, label: 'Total XP', value: gamification.xp, color: Colors.light.level },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.profileCard, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{user?.avatarEmoji ?? '😊'}</Text>
          </View>
          <View style={styles.editAvatarBadge}>
            <Edit3 size={10} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {showEmojiPicker && (
          <View style={styles.emojiPicker}>
            {AVATAR_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiOption,
                  user?.avatarEmoji === emoji && styles.emojiOptionSelected,
                ]}
                onPress={() => handleSelectEmoji(emoji)}
              >
                <Text style={styles.emojiOptionText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isEditingName ? (
          <View style={styles.editNameRow}>
            <TextInput
              style={styles.editNameInput}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              maxLength={30}
            />
            <TouchableOpacity style={styles.editActionBtn} onPress={handleSaveName}>
              <Check size={16} color={Colors.light.tint} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editActionBtn} onPress={() => setIsEditingName(false)}>
              <X size={16} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.nameRow}
            onPress={() => {
              setEditName(user?.name ?? '');
              setIsEditingName(true);
            }}
          >
            <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
            <Edit3 size={14} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}

        <Text style={styles.userEmail}>{user?.email ?? ''}</Text>

        <View style={styles.levelRow}>
          <View style={styles.levelPill}>
            <Star size={12} color={Colors.light.level} />
            <Text style={styles.levelPillText}>Level {gamification.levelInfo.level}</Text>
          </View>
          <Text style={styles.levelTitle}>{levelTitle}</Text>
        </View>
      </Animated.View>

      <Text style={styles.sectionLabel}>Statistics</Text>
      <View style={styles.statsGrid}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Animated.View
              key={stat.label}
              style={[
                styles.statCard,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
                  }],
                },
              ]}
            >
              <View style={[styles.statIconWrap, { backgroundColor: stat.color + '12' }]}>
                <Icon size={16} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Quick Links</Text>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push('/(tabs)/badges' as never)}
        activeOpacity={0.7}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: Colors.light.badgeLight }]}>
          <Award size={18} color={Colors.light.badge} />
        </View>
        <Text style={styles.menuItemText}>All Badges</Text>
        <ChevronRight size={18} color={Colors.light.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.signOutBtn]}
        onPress={handleSignOut}
        activeOpacity={0.85}
        testID="sign-out-button"
      >
        <LogOut size={18} color={Colors.light.fire} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 20, paddingTop: 12 },

  profileCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tintLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.light.tint + '25',
  },
  avatarEmoji: { fontSize: 40 },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.surface,
  },

  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 12,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  emojiOptionSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  emojiOptionText: { fontSize: 22 },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  userName: { fontSize: 22, fontWeight: '800' as const, color: Colors.light.text },
  userEmail: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 12 },

  editNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  editNameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  editActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.levelLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  levelPillText: { fontSize: 13, fontWeight: '700' as const, color: Colors.light.level },
  levelTitle: { fontSize: 14, color: Colors.light.textSecondary, fontWeight: '600' as const },

  sectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '31%',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.light.text, marginBottom: 2 },
  statLabel: { fontSize: 10, color: Colors.light.textSecondary, textAlign: 'center', fontWeight: '500' as const },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemText: { flex: 1, fontSize: 15, fontWeight: '600' as const, color: Colors.light.text },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.fireLight,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.light.fire + '20',
  },
  signOutText: { fontSize: 15, fontWeight: '700' as const, color: Colors.light.fire },

  bottomSpacer: { height: 40 },
});
