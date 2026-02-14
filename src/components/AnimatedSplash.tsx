import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  G,
  Rect,
  Polygon,
  Path,
  Circle,
} from 'react-native-svg';

const PURPLE = '#6C63FF';
const CYAN = '#00D9FF';
const BG = '#0F0F1A';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  const [phase, setPhase] = useState(0);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);   // pen fades in
    const t2 = setTimeout(() => setPhase(2), 600);   // stroke draws
    const t3 = setTimeout(() => setPhase(3), 1600);  // text fades in
    const t4 = setTimeout(() => setPhase(4), 2400);  // tagline
    const t5 = setTimeout(() => {
      // Fade out and call complete
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete?.();
      });
    }, 3200);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Subtle radial glow effect */}
      <View style={styles.glowContainer}>
        <View style={styles.glow} />
      </View>

      {/* Icon area */}
      <View style={styles.iconContainer}>
        <Svg width={200} height={160} viewBox="0 0 200 160">
          <Defs>
            <LinearGradient id="strokeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={PURPLE} />
              <Stop offset="100%" stopColor={CYAN} />
            </LinearGradient>
            <LinearGradient id="penGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#9B94FF" />
              <Stop offset="100%" stopColor={PURPLE} />
            </LinearGradient>
          </Defs>

          {/* Pen */}
          <G
            transform="translate(142, 28) rotate(-45)"
            opacity={phase >= 1 ? 1 : 0}
          >
            {/* Shaft */}
            <Rect x={-7} y={-42} width={14} height={38} rx={2} fill="url(#penGrad)" />
            {/* Band */}
            <Rect x={-8} y={-6} width={16} height={4} rx={1} fill="#ADA6FF" />
            {/* Nib */}
            <Polygon points="-7,-2 7,-2 2,14 -2,14" fill="#C4BFFF" />
            {/* Tip */}
            <Polygon points="-2,14 2,14 0,22" fill="#E0DDFF" />
          </G>

          {/* Signature stroke */}
          <Path
            d="M 10,130 C 40,100 70,90 95,100 C 120,110 110,135 135,125 C 155,117 160,98 178,92"
            stroke="url(#strokeGrad)"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={phase >= 2 ? 1 : 0}
          />

          {/* Tail flick */}
          <Path
            d="M 178,92 C 183,88 188,82 186,76"
            stroke={CYAN}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            opacity={phase >= 2 ? 0.8 : 0}
          />

          {/* Start dot */}
          <Circle
            cx={10}
            cy={130}
            r={2.5}
            fill={PURPLE}
            opacity={phase >= 2 ? 0.7 : 0}
          />
        </Svg>
      </View>

      {/* App name */}
      <View style={[styles.titleContainer, { opacity: phase >= 3 ? 1 : 0 }]}>
        <Text style={styles.titleWhite}>Sign</Text>
        <Text style={styles.titleGradient}>Snap</Text>
      </View>

      {/* Tagline */}
      <Text style={[styles.tagline, { opacity: phase >= 4 ? 1 : 0 }]}>
        SIGN ANYWHERE
      </Text>

      {/* Bottom accent line */}
      <View style={[styles.bottomLine, { opacity: phase >= 4 ? 0.3 : 0 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  glowContainer: {
    position: 'absolute',
    width: 500,
    height: 500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: PURPLE,
    opacity: 0.08,
  },
  iconContainer: {
    width: 200,
    height: 160,
    marginBottom: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleWhite: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  titleGradient: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: PURPLE, // Can't do gradient text easily in RN, using solid purple
  },
  tagline: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 3,
    color: '#6B6B8D',
  },
  bottomLine: {
    position: 'absolute',
    bottom: 48,
    width: 30,
    height: 2,
    borderRadius: 1,
    backgroundColor: PURPLE,
  },
});
