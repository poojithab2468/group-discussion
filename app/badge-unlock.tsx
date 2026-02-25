import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useGamification } from '@/context/GamificationContext';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BadgeUnlockScreen() {
  const { newBadge, dismissBadge } = useGamification();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (newBadge) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
          Animated.spring(emojiScale, { toValue: 1, friction: 3, tension: 50, delay: 150, useNativeDriver: true }),
        ]),
        Animated.stagger(100, [
          Animated.spring(sparkle1, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.spring(sparkle2, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.spring(sparkle3, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [newBadge]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      dismissBadge();
      router.back();
    });
  };

  if (!newBadge) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableOpacity style={styles.backdrop} onPress={handleDismiss} activeOpacity={1} />

      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={[styles.sparkle, styles.sparkle1, {
          opacity: sparkle1,
          transform: [{ scale: sparkle1 }, { rotate: '15deg' }],
        }]}>
          <Text style={styles.sparkleText}>✨</Text>
        </Animated.View>
        <Animated.View style={[styles.sparkle, styles.sparkle2, {
          opacity: sparkle2,
          transform: [{ scale: sparkle2 }, { rotate: '-20deg' }],
        }]}>
          <Text style={styles.sparkleText}>⭐</Text>
        </Animated.View>
        <Animated.View style={[styles.sparkle, styles.sparkle3, {
          opacity: sparkle3,
          transform: [{ scale: sparkle3 }, { rotate: '30deg' }],
        }]}>
          <Text style={styles.sparkleText}>🎉</Text>
        </Animated.View>

        <Text style={styles.congrats}>Badge Unlocked!</Text>

        <Animated.View
          style={[
            styles.emojiWrap,
            { backgroundColor: newBadge.color + '15' },
            { transform: [{ scale: emojiScale }] },
          ]}
        >
          <Text style={styles.emoji}>{newBadge.emoji}</Text>
        </Animated.View>

        <Text style={styles.badgeTitle}>{newBadge.title}</Text>
        <Text style={styles.badgeDesc}>{newBadge.description}</Text>

        <View style={styles.xpBonusRow}>
          <Text style={styles.xpBonusText}>+50 XP Bonus</Text>
        </View>

        <TouchableOpacity
          style={[styles.dismissBtn, { backgroundColor: newBadge.color }]}
          onPress={handleDismiss}
          activeOpacity={0.85}
        >
          <Text style={styles.dismissBtnText}>Awesome!</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: SCREEN_WIDTH - 60,
    backgroundColor: Colors.light.surface,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  sparkle: { position: 'absolute' },
  sparkle1: { top: -12, left: 20 },
  sparkle2: { top: -8, right: 24 },
  sparkle3: { top: 30, right: -5 },
  sparkleText: { fontSize: 24 },

  congrats: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.badge,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  emojiWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: { fontSize: 52 },
  badgeTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeDesc: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  xpBonusRow: {
    backgroundColor: Colors.light.xpLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 24,
  },
  xpBonusText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.xp,
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
