import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const switchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
      Animated.spring(formAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    switchAnim.setValue(0);
    Animated.spring(switchAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    setErrors({});
  }, [isSignUp]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (isSignUp && !name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isSignUp) {
      signUp(name.trim(), email.trim(), password);
    } else {
      signIn(email.trim(), password);
    }
    console.log('[Auth] Submit:', isSignUp ? 'signUp' : 'signIn');
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topDecor}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💬</Text>
          </View>
          <Text style={styles.appName}>GD Practice</Text>
          <Text style={styles.tagline}>
            {isSignUp ? 'Create your account to start' : 'Welcome back! Sign in to continue'}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: formAnim,
              transform: [
                { translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, !isSignUp && styles.tabActive]}
              onPress={() => setIsSignUp(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, isSignUp && styles.tabActive]}
              onPress={() => setIsSignUp(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Animated.View
            style={{ opacity: switchAnim, transform: [{ scale: switchAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }}
          >
            {isSignUp && (
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, errors.name ? styles.inputError : null]}>
                  <User size={18} color={errors.name ? Colors.light.fire : Colors.light.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    testID="auth-name-input"
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
            )}

            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                <Mail size={18} color={errors.email ? Colors.light.fire : Colors.light.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="auth-email-input"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                <Lock size={18} color={errors.password ? Colors.light.fire : Colors.light.textSecondary} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  testID="auth-password-input"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.light.textSecondary} />
                  ) : (
                    <Eye size={18} color={Colors.light.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.85}
              testID="auth-submit-button"
            >
              <Text style={styles.submitButtonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <View style={styles.bottomHint}>
          <Sparkles size={14} color={Colors.light.gold} />
          <Text style={styles.hintText}>AI-powered GD analysis & gamified learning</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    top: -80,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.light.tint + '08',
  },
  decorCircle2: {
    position: 'absolute',
    top: 20,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.light.gold + '06',
  },
  decorCircle3: {
    position: 'absolute',
    top: 100,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.accent + '06',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.light.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: Colors.light.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: Colors.light.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.light.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 4,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.light.fire + '40',
    backgroundColor: Colors.light.fireLight,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.fire,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    paddingVertical: 17,
    gap: 8,
    marginTop: 8,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  bottomHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
  },
  hintText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
});
