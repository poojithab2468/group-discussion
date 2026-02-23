import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import {
  ChevronLeft,
  Send,
  Trash2,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Type,
  Clock,
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useSessions } from '@/context/SessionContext';
import Colors from '@/constants/colors';
import { CATEGORY_CONFIG, PracticeEntry, InputMode } from '@/types/session';
import { generateText } from '@rork-ai/toolkit-sdk';
import * as Haptics from 'expo-haptics';

const STT_URL = 'https://toolkit.rork.com/stt/transcribe/';

function EntryCard({
  entry,
  sessionId,
  onDelete,
}: {
  entry: PracticeEntry;
  sessionId: string;
  onDelete: (sessionId: string, entryId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = useCallback(() => {
    const doDelete = () => {
      onDelete(sessionId, entry.id);
    };
    if (Platform.OS === 'web') {
      if (confirm('Delete this entry?')) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Entry', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [sessionId, entry.id, onDelete]);

  return (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryTimeRow}>
          <View style={styles.entryTimeBadge}>
            <Clock size={11} color={Colors.light.tint} />
            <Text style={styles.entryTime}>
              {new Date(entry.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={[
            styles.inputModeBadge,
            entry.inputMode === 'voice' ? styles.voiceBadge : styles.textBadge,
          ]}>
            {entry.inputMode === 'voice' ? (
              <Mic size={10} color={Colors.light.voiceActive} />
            ) : (
              <Type size={10} color={Colors.light.tint} />
            )}
            <Text style={[
              styles.inputModeText,
              entry.inputMode === 'voice' ? styles.voiceBadgeText : styles.textBadgeText,
            ]}>
              {entry.inputMode === 'voice' ? 'Voice' : 'Text'}
            </Text>
          </View>
          <Text style={styles.entryWordCount}>{entry.wordCount} words</Text>
        </View>
        <TouchableOpacity
          style={styles.entryDeleteBtn}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={13} color="#E8564A" />
        </TouchableOpacity>
      </View>

      <Text style={styles.entryText} numberOfLines={expanded ? undefined : 3}>
        {entry.text}
      </Text>

      {entry.analysis && (
        <TouchableOpacity
          style={styles.analysisToggle}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Sparkles size={13} color={Colors.light.tint} />
          <Text style={styles.analysisToggleText}>
            {expanded ? 'Hide Analysis' : 'View AI Feedback'}
          </Text>
          {expanded ? (
            <ChevronUp size={14} color={Colors.light.tint} />
          ) : (
            <ChevronDown size={14} color={Colors.light.tint} />
          )}
        </TouchableOpacity>
      )}

      {expanded && entry.analysis && (
        <View style={styles.analysisBox}>
          <Text style={styles.analysisText}>{entry.analysis}</Text>
        </View>
      )}
    </View>
  );
}

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSession, addEntry, updateEntryAnalysis, deleteEntry } = useSessions();
  const session = getSession(id ?? '');

  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startTimer = useCallback(() => {
    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRecordingNative = useCallback(async () => {
    try {
      console.log('[PracticeScreen] Requesting audio permissions...');
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Please grant microphone access to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: 4,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: 1,
          audioQuality: 127,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      startTimer();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      console.log('[PracticeScreen] Native recording started');
    } catch (error) {
      console.error('[PracticeScreen] Failed to start native recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }, [startTimer]);

  const stopRecordingNative = useCallback(async () => {
    try {
      const recording = recordingRef.current;
      if (!recording) return;

      console.log('[PracticeScreen] Stopping native recording...');
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      stopTimer();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!uri) {
        console.error('[PracticeScreen] No recording URI');
        return;
      }

      console.log('[PracticeScreen] Recording URI:', uri);
      setIsTranscribing(true);

      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const formData = new FormData();
      const audioFile = {
        uri,
        name: 'recording.' + fileType,
        type: 'audio/' + fileType,
      };
      formData.append('audio', audioFile as unknown as Blob);

      console.log('[PracticeScreen] Sending to STT...');
      const response = await fetch(STT_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`STT failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[PracticeScreen] STT result:', result.text?.substring(0, 50));

      if (result.text && result.text.trim()) {
        setInputText((prev) => {
          const combined = prev ? prev + ' ' + result.text.trim() : result.text.trim();
          return combined;
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('No Speech Detected', 'Could not detect any speech. Please try again.');
      }
    } catch (error) {
      console.error('[PracticeScreen] STT error:', error);
      Alert.alert('Transcription Error', 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  }, [stopTimer]);

  const startRecordingWeb = useCallback(async () => {
    try {
      console.log('[PracticeScreen] Starting web recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      startTimer();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      console.log('[PracticeScreen] Web recording started');
    } catch (error) {
      console.error('[PracticeScreen] Web recording error:', error);
      Alert.alert('Error', 'Could not access microphone. Please check permissions.');
    }
  }, [startTimer]);

  const stopRecordingWeb = useCallback(async () => {
    try {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) return;

      console.log('[PracticeScreen] Stopping web recording...');

      return new Promise<void>((resolve) => {
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          mediaRecorderRef.current = null;
          setIsRecording(false);
          stopTimer();

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setIsTranscribing(true);

          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            console.log('[PracticeScreen] Sending web audio to STT...');
            const response = await fetch(STT_URL, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`STT failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('[PracticeScreen] Web STT result:', result.text?.substring(0, 50));

            if (result.text && result.text.trim()) {
              setInputText((prev) => {
                const combined = prev ? prev + ' ' + result.text.trim() : result.text.trim();
                return combined;
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Alert.alert('No Speech Detected', 'Could not detect any speech. Please try again.');
            }
          } catch (error) {
            console.error('[PracticeScreen] Web STT error:', error);
            Alert.alert('Transcription Error', 'Failed to transcribe audio. Please try again.');
          } finally {
            setIsTranscribing(false);
          }
          resolve();
        };

        mediaRecorder.stop();
      });
    } catch (error) {
      console.error('[PracticeScreen] Stop web recording error:', error);
      setIsRecording(false);
      setIsTranscribing(false);
      stopTimer();
    }
  }, [stopTimer]);

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      if (Platform.OS === 'web') {
        await stopRecordingWeb();
      } else {
        await stopRecordingNative();
      }
    } else {
      setInputMode('voice');
      if (Platform.OS === 'web') {
        await startRecordingWeb();
      } else {
        await startRecordingNative();
      }
    }
  }, [isRecording, startRecordingNative, stopRecordingNative, startRecordingWeb, stopRecordingWeb]);

  const handleSubmit = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !session) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newEntry: PracticeEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      text: trimmed,
      inputMode,
      analysis: null,
      wordCount: trimmed.split(/\s+/).filter(Boolean).length,
      createdAt: new Date().toISOString(),
    };

    addEntry(session.id, newEntry);
    setInputText('');
    setInputMode('text');
    console.log('[PracticeScreen] GD Entry added:', newEntry.id, 'mode:', newEntry.inputMode);

    setIsAnalyzing(true);
    try {
      const categoryLabel = CATEGORY_CONFIG[session.category].label;
      const topicContext = session.topic ? `\nGD Topic: "${session.topic}"` : '';

      const prompt = `You are a Group Discussion (GD) evaluator and coach. Analyze this GD response on the topic category "${categoryLabel}".${topicContext}

Evaluate on these GD-specific criteria:
1. **Content & Relevance** - Are the points relevant to the topic? Is there depth of knowledge?
2. **Structure & Coherence** - Is the argument logically structured? Good opening/body/conclusion?
3. **Communication & Clarity** - Is the language clear, persuasive, and confident?
4. **Vocabulary & Grammar** - Quality of vocabulary, any grammatical issues?
5. **Critical Thinking** - Does it show original thinking, counterarguments, or balanced view?

Provide:
- A brief overall assessment (2-3 lines)
- Score out of 10 for each criterion
- Top 2-3 strengths
- Top 2-3 areas to improve
- One specific suggestion for the next attempt

Keep it concise (max 200 words). Be constructive and encouraging.

GD Response to analyze:
"${trimmed}"`;

      const analysis = await generateText(prompt);
      updateEntryAnalysis(session.id, newEntry.id, analysis);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('[PracticeScreen] GD Analysis complete for entry:', newEntry.id);
    } catch (error) {
      console.error('[PracticeScreen] Analysis failed:', error);
      updateEntryAnalysis(session.id, newEntry.id, 'Analysis unavailable. Please try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputText, inputMode, session, addEntry, updateEntryAnalysis]);

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <Text style={styles.errorText}>Session not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = CATEGORY_CONFIG[session.category];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBack}
            >
              <ChevronLeft size={22} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.topSection, { opacity: fadeAnim }]}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: config.color + '18' },
            ]}
          >
            <Text style={styles.badgeEmoji}>{config.emoji}</Text>
            <Text style={[styles.categoryLabel, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          {session.topic ? (
            <View style={styles.topicBanner}>
              <Text style={styles.topicBannerLabel}>Topic</Text>
              <Text style={styles.topicBannerText}>{session.topic}</Text>
            </View>
          ) : null}
          {session.description ? (
            <Text style={styles.sessionDescription}>{session.description}</Text>
          ) : null}
        </Animated.View>

        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <View style={styles.inputModeRow}>
              <TouchableOpacity
                style={[
                  styles.modeTab,
                  inputMode === 'text' && styles.modeTabActive,
                ]}
                onPress={() => setInputMode('text')}
                activeOpacity={0.7}
              >
                <Type size={14} color={inputMode === 'text' ? Colors.light.tint : Colors.light.textSecondary} />
                <Text style={[
                  styles.modeTabText,
                  inputMode === 'text' && styles.modeTabTextActive,
                ]}>
                  Text
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeTab,
                  inputMode === 'voice' && styles.modeTabActive,
                ]}
                onPress={() => setInputMode('voice')}
                activeOpacity={0.7}
              >
                <Mic size={14} color={inputMode === 'voice' ? Colors.light.voiceActive : Colors.light.textSecondary} />
                <Text style={[
                  styles.modeTabText,
                  inputMode === 'voice' && styles.modeTabVoiceActive,
                ]}>
                  Voice
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {inputMode === 'voice' && (
            <View style={styles.voiceSection}>
              <Animated.View style={[
                styles.recordButtonOuter,
                isRecording && { transform: [{ scale: pulseAnim }] },
              ]}>
                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                  ]}
                  onPress={handleToggleRecording}
                  disabled={isTranscribing}
                  activeOpacity={0.8}
                  testID="record-button"
                >
                  {isTranscribing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : isRecording ? (
                    <MicOff size={28} color="#FFFFFF" />
                  ) : (
                    <Mic size={28} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.recordLabel}>
                {isTranscribing
                  ? 'Transcribing your speech...'
                  : isRecording
                  ? `Recording ${formatDuration(recordingDuration)} — Tap to stop`
                  : 'Tap to start recording'}
              </Text>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder={
                inputMode === 'voice'
                  ? 'Voice transcript will appear here. You can also type to edit...'
                  : 'Type your GD response here...'
              }
              placeholderTextColor={Colors.light.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="top"
              testID="practice-text-input"
            />
            {inputText.trim().length > 0 && (
              <Text style={styles.wordCounter}>
                {inputText.trim().split(/\s+/).filter(Boolean).length} words
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!inputText.trim() || isAnalyzing || isRecording || isTranscribing) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!inputText.trim() || isAnalyzing || isRecording || isTranscribing}
            activeOpacity={0.8}
            testID="submit-text-button"
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Analyzing GD Response...</Text>
              </>
            ) : (
              <>
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit & Get Feedback</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {session.entries.length > 0 && (
          <View style={styles.entriesList}>
            <View style={styles.entriesHeader}>
              <MessageSquare size={16} color={Colors.light.text} />
              <Text style={styles.entriesTitle}>
                Your Responses
              </Text>
              <View style={styles.entriesCountBadge}>
                <Text style={styles.entriesCount}>{session.entries.length}</Text>
              </View>
            </View>
            {session.entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                sessionId={session.id}
                onDelete={deleteEntry}
              />
            ))}
          </View>
        )}

        {session.entries.length === 0 && (
          <View style={styles.emptyEntries}>
            <View style={styles.emptyIconWrap}>
              <MessageSquare size={32} color={Colors.light.textSecondary} />
            </View>
            <Text style={styles.emptyEntriesTitle}>No responses yet</Text>
            <Text style={styles.emptyEntriesText}>
              Type or record your GD response above to get AI-powered feedback on your discussion skills
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 7,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  topicBanner: {
    backgroundColor: Colors.light.tintLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint + '20',
  },
  topicBannerLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.light.tint,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  topicBannerText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  sessionDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputHeader: {
    marginBottom: 12,
  },
  inputModeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: Colors.light.tintLight,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.light.tint,
  },
  modeTabVoiceActive: {
    color: Colors.light.voiceActive,
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 12,
  },
  recordButtonOuter: {
    marginBottom: 12,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.voiceActive,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.voiceActive,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButtonActive: {
    backgroundColor: '#991B1B',
  },
  recordLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.voiceActive,
  },
  recordingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.voiceActive,
  },
  inputWrapper: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: 14,
    overflow: 'hidden',
  },
  textInput: {
    minHeight: 120,
    maxHeight: 220,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  wordCounter: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.light.borderLight,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  entriesList: {
    marginTop: 4,
  },
  entriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  entriesTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
  },
  entriesCountBadge: {
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  entriesCount: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.light.tint,
  },
  entryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  entryTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  entryTime: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  inputModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  voiceBadge: {
    backgroundColor: '#FEF2F2',
  },
  textBadge: {
    backgroundColor: Colors.light.tintLight,
  },
  inputModeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  voiceBadgeText: {
    color: Colors.light.voiceActive,
  },
  textBadgeText: {
    color: Colors.light.tint,
  },
  entryWordCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  entryDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEF0EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 21,
    marginBottom: 10,
  },
  analysisToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  analysisToggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.tint,
    flex: 1,
  },
  analysisBox: {
    backgroundColor: Colors.light.tintLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
  },
  analysisText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 20,
  },
  emptyEntries: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.light.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyEntriesTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  emptyEntriesText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  bottomSpacer: {
    height: 40,
  },
});
