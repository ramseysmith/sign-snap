import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../utils/constants';

interface ScanGuideModalProps {
  visible: boolean;
  /** Called when the user chooses to start; `dontShowAgain` persists their choice. */
  onStart: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

interface StepProps {
  icon: string;
  title: string;
  text: string;
}

function Step({ icon, title, text }: StepProps) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIcon}>
        <Text style={styles.stepIconText}>{icon}</Text>
      </View>
      <View style={styles.stepTextWrap}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{text}</Text>
      </View>
    </View>
  );
}

export default function ScanGuideModal({ visible, onStart, onCancel }: ScanGuideModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      pulse.value = 0;
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      );
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.7 }],
    opacity: 0.45 * (1 - pulse.value),
  }));

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStart(dontShowAgain);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            How Scanning Works
          </Text>
          <Text style={styles.subtitle}>A few quick steps to scan your document</Text>

          <View style={styles.steps}>
            <Step
              icon="🎯"
              title="Aim & hold steady"
              text="Point your camera at the document — it captures automatically once it's in view."
            />
            <Step
              icon="📑"
              title="Capture each page"
              text="Scanning more than one page? Snap them one after another."
            />

            {/* The key step — finishing with the checkmark. */}
            <View style={[styles.step, styles.stepHighlight]}>
              <View style={styles.checkWrap}>
                <Animated.View style={[styles.checkPulse, pulseStyle]} />
                <View style={styles.checkCircle}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>Tap the ✓ to finish</Text>
                <Text style={styles.stepText}>
                  This is the important one. When you&apos;re done, tap the checkmark (or “Save”)
                  to continue — nothing happens until you do.
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={styles.dontShowRow}
            onPress={() => setDontShowAgain((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: dontShowAgain }}
            accessibilityLabel="Don't show this again"
            hitSlop={8}
          >
            <View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
              {dontShowAgain && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.dontShowText}>Don&apos;t show this again</Text>
          </Pressable>

          <Pressable
            style={styles.startButton}
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Start scanning"
          >
            <Text style={styles.startButtonText}>Got it — Start Scanning</Text>
          </Pressable>
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  steps: {
    gap: SPACING.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepHighlight: {
    backgroundColor: 'rgba(108,99,255,0.10)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconText: {
    fontSize: 22,
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  stepText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  // Checkmark visual (mirrors the scanner's finish button)
  checkWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: -1,
  },
  dontShowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    alignSelf: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  dontShowText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
  },
  startButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
