import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { AppText } from '@/components/AppText';
import { resolveMediaUrl } from '@/services/mediaCache';

export interface AudioResponseQuestionProps {
  audioUri?: string | null;
  maxDurationSeconds?: number;
  instructionText?: string;
  onRecordComplete: (uri: string) => void;
  onClearRecord?: () => void;
}

export const AudioResponseQuestion: React.FC<AudioResponseQuestionProps> = ({
  audioUri,
  maxDurationSeconds = 120,
  instructionText = 'Tap the microphone to record your audio response.',
  onRecordComplete,
  onClearRecord,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  // Audio Playback state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);

  // Waveform animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barAnim1 = useRef(new Animated.Value(15)).current;
  const barAnim2 = useRef(new Animated.Value(30)).current;
  const barAnim3 = useRef(new Animated.Value(45)).current;
  const barAnim4 = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    (async () => {
      try {
        const perm = await Audio.requestPermissionsAsync();
        setPermissionGranted(perm.status === 'granted');
      } catch (e) {
        console.warn('Audio permission request failed:', e);
      }
    })();
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  // Recording Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= maxDurationSeconds - 1) {
            stopRecording();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, maxDurationSeconds]);

  // Pulsing animation when recording
  useEffect(() => {
    if (isRecording) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    if (!permissionGranted) {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed to record your audio response.');
        return;
      }
      setPermissionGranted(true);
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Could not start microphone recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (uri) {
        onRecordComplete(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const handlePlaySound = async () => {
    if (!audioUri) return;
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const resolved = resolveMediaUrl(audioUri);
        if (!resolved) return;

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: resolved },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPlaybackPosition(status.positionMillis || 0);
              setPlaybackDuration(status.durationMillis || 0);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPlaybackPosition(0);
              }
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const maxMinsStr = formatSeconds(maxDurationSeconds);

  return (
    <View style={styles.container}>
      <AppText style={styles.instructionText}>{instructionText}</AppText>

      {audioUri ? (
        /* Recorded Audio Preview State */
        <View style={styles.playbackCard}>
          <View style={styles.playbackLeft}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlaySound}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <View style={{ marginLeft: 12 }}>
              <AppText style={styles.playbackTitle}>Audio Response Recorded</AppText>
              <AppText style={styles.playbackSubtitle}>
                {playbackDuration > 0
                  ? `${formatSeconds(playbackPosition / 1000)} / ${formatSeconds(playbackDuration / 1000)}`
                  : 'Ready to playback'}
              </AppText>
            </View>
          </View>

          {onClearRecord && (
            <TouchableOpacity
              style={styles.reRecordButton}
              onPress={() => {
                if (sound) sound.unloadAsync().catch(() => {});
                setSound(null);
                setIsPlaying(false);
                onClearRecord();
              }}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={14} color="#7C3AED" />
              <AppText style={styles.reRecordText}>Re-record</AppText>
            </TouchableOpacity>
          )}
        </View>
      ) : isRecording ? (
        /* Active Recording State */
        <View style={styles.recordingCard}>
          <Animated.View style={[styles.recordPulseCircle, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
              activeOpacity={0.8}
            >
              <Ionicons name="stop" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>

          <AppText style={styles.recordingStatusText}>Recording Audio...</AppText>
          <AppText style={styles.timerText}>
            {formatSeconds(recordingSeconds)} / {maxMinsStr}
          </AppText>

          {/* Waveform Visualizer */}
          <View style={styles.waveformContainer}>
            {[barAnim1, barAnim2, barAnim3, barAnim4, barAnim2, barAnim1, barAnim3, barAnim4].map(
              (anim, idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.waveformBar,
                    { height: anim, backgroundColor: idx % 2 === 0 ? '#7C3AED' : '#A78BFA' },
                  ]}
                />
              )
            )}
          </View>
        </View>
      ) : (
        /* Ready to Record State */
        <View style={styles.readyCard}>
          <TouchableOpacity
            style={styles.micCircleButton}
            onPress={startRecording}
            activeOpacity={0.85}
          >
            <Feather name="mic" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <AppText style={styles.micPromptText}>Tap to Start Recording</AppText>
          <AppText style={styles.maxTimeText}>Max duration: {maxMinsStr}</AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  instructionText: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 14,
  },

  // Ready State Card
  readyCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
  },
  micCircleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  micPromptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4C1D95',
    marginBottom: 4,
  },
  maxTimeText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Recording Active Card
  recordingCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  recordPulseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingStatusText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 14,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 48,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },

  // Playback Card
  playbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  playbackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  playbackSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  reRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  reRecordText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#7C3AED',
  },
});
