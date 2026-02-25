import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Award, Lock, CheckCircle } from 'lucide-react-native';
import { useGamification } from '@/context/GamificationContext';
import Colors from '@/constants/colors';
import { BADGES } from '@/constants/gamification';

function BadgeCard({
  badge,
  earned,
  index,
}: {
  badge: typeof BADGES[0];
  earned: boolean;
  index: number;
}) {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 80,
      useNativeDriver: true,
    }).start();

    if (earned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(shineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [index, earned]);

  return (
    <Animated.View
      style={[
        styles.badgeCard,
        earned && { borderColor: badge.color + '30' },
        {
          opacity: cardAnim,
          transform: [{
            translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
          }, {
            scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
          }],
        },
      ]}
    >
      {earned && (
        <Animated.View
          style={[
            styles.shineOverlay,
            { backgroundColor: badge.color + '05', opacity: shineAnim },
          ]}
        />
      )}
      <View style={[
        styles.badgeEmojiWrap,
        { backgroundColor: earned ? badge.color + '15' : Colors.light.background },
      ]}>
        <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>
          {badge.emoji}
        </Text>
        {earned && (
          <View style={[styles.checkMark, { backgroundColor: badge.color }]}>
            <CheckCircle size={10} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.badgeInfo}>
        <Text style={[styles.badgeTitle, !earned && styles.badgeTitleLocked]}>
          {badge.title}
        </Text>
        <Text style={styles.badgeDesc}>{badge.description}</Text>
      </View>

      {!earned && (
        <View style={styles.lockIcon}>
          <Lock size={14} color={Colors.light.textSecondary} />
        </View>
      )}
      {earned && (
        <View style={[styles.earnedPill, { backgroundColor: badge.color + '15' }]}>
          <Text style={[styles.earnedText, { color: badge.color }]}>Earned</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function BadgesScreen() {
  const { earnedBadges } = useGamification();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const earnedIds = earnedBadges.map((b) => b.id);
  const earnedList = BADGES.filter((b) => earnedIds.includes(b.id));
  const lockedList = BADGES.filter((b) => !earnedIds.includes(b.id));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.headerCard, { opacity: fadeAnim }]}>
        <View style={styles.headerIconWrap}>
          <Award size={28} color={Colors.light.badge} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>
            {earnedList.length} / {BADGES.length}
          </Text>
          <Text style={styles.headerSubtitle}>Badges Earned</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(earnedList.length / BADGES.length) * 100}%` },
            ]}
          />
        </View>
      </Animated.View>

      {earnedList.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Earned</Text>
          {earnedList.map((badge, i) => (
            <BadgeCard key={badge.id} badge={badge} earned index={i} />
          ))}
        </>
      )}

      {lockedList.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Locked</Text>
          {lockedList.map((badge, i) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={false}
              index={i + earnedList.length}
            />
          ))}
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 20, paddingTop: 12 },

  headerCard: {
    backgroundColor: Colors.light.badgeLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.badge + '20',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.light.badge + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800' as const, color: Colors.light.text },
  headerSubtitle: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.light.badge + '20',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.badge,
    borderRadius: 3,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
    marginTop: 4,
  },

  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    overflow: 'hidden',
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
  },
  badgeEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  badgeEmoji: { fontSize: 26 },
  badgeEmojiLocked: { opacity: 0.35 },
  checkMark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.surface,
  },

  badgeInfo: { flex: 1 },
  badgeTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.light.text, marginBottom: 3 },
  badgeTitleLocked: { color: Colors.light.textSecondary },
  badgeDesc: { fontSize: 12, color: Colors.light.textSecondary, lineHeight: 17 },

  lockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  earnedPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  earnedText: { fontSize: 11, fontWeight: '700' as const },

  bottomSpacer: { height: 40 },
});
