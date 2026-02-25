import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { MessageSquare, Mic, Trophy, ArrowRight, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '💬',
    icon: MessageSquare,
    title: 'Master Group Discussions',
    subtitle: 'Practice GD topics with AI-powered feedback and become a confident communicator',
    color: Colors.light.tint,
    bgColor: Colors.light.tintLight,
  },
  {
    emoji: '🎤',
    icon: Mic,
    title: 'Voice & Text Input',
    subtitle: 'Record your voice or type responses — get instant analysis on fluency, coherence, and content',
    color: Colors.light.accent,
    bgColor: Colors.light.voiceLight,
  },
  {
    emoji: '🏆',
    icon: Trophy,
    title: 'Track Your Growth',
    subtitle: 'Earn XP, maintain streaks, unlock badges, and watch yourself level up every day',
    color: Colors.light.gold,
    bgColor: Colors.light.goldLight,
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnims = useRef(SLIDES.map(() => new Animated.Value(0))).current;
  const scaleAnims = useRef(SLIDES.map(() => new Animated.Value(0.8))).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animateSlide(0);
  }, []);

  const animateSlide = (index: number) => {
    fadeAnims.forEach((a, i) => {
      Animated.timing(a, { toValue: i === index ? 1 : 0, duration: 300, useNativeDriver: true }).start();
    });
    scaleAnims.forEach((a, i) => {
      Animated.spring(a, { toValue: i === index ? 1 : 0.8, friction: 6, useNativeDriver: true }).start();
    });
    Animated.spring(buttonAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    Animated.timing(dotAnim, { toValue: index, duration: 250, useNativeDriver: false }).start();
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      setActiveIndex(next);
      animateSlide(next);
    } else {
      completeOnboarding();
      router.replace('/auth' as never);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/auth' as never);
  };

  const slide = SLIDES[activeIndex];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topDecor}>
        <View style={[styles.decorCircle1, { backgroundColor: slide.color + '08' }]} />
        <View style={[styles.decorCircle2, { backgroundColor: slide.color + '05' }]} />
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.slideArea}>
        {SLIDES.map((s, i) => (
          <Animated.View
            key={i}
            style={[
              styles.slide,
              {
                opacity: fadeAnims[i],
                transform: [{ scale: scaleAnims[i] }],
                position: i === activeIndex ? 'relative' as const : 'absolute' as const,
                zIndex: i === activeIndex ? 1 : 0,
              },
            ]}
            pointerEvents={i === activeIndex ? 'auto' : 'none'}
          >
            <View style={[styles.iconCircle, { backgroundColor: s.bgColor }]}>
              <View style={[styles.iconInner, { backgroundColor: s.color + '15' }]}>
                <Text style={styles.slideEmoji}>{s.emoji}</Text>
              </View>
            </View>
            <Text style={styles.slideTitle}>{s.title}</Text>
            <Text style={styles.slideSubtitle}>{s.subtitle}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && { backgroundColor: slide.color, width: 24 },
              ]}
            />
          ))}
        </View>

        <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: slide.color }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            {activeIndex === SLIDES.length - 1 ? (
              <>
                <Sparkles size={18} color="#FFFFFF" />
                <Text style={styles.nextButtonText}>Get Started</Text>
              </>
            ) : (
              <>
                <Text style={styles.nextButtonText}>Continue</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  decorCircle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  decorCircle2: {
    position: 'absolute',
    top: 40,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  skipText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '600' as const,
  },
  slideArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slide: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideEmoji: {
    fontSize: 48,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 36,
    gap: 28,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.borderLight,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
