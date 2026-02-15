import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
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

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const penOpacity = useRef(new Animated.Value(0)).current;
  const penTranslateY = useRef(new Animated.Value(-20)).current;
  const strokeOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(15)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      // Initial delay
      Animated.delay(200),

      // Glow fades in and scales up
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]),

      // Pen drops in smoothly
      Animated.parallel([
        Animated.timing(penOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.spring(penTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // Short pause
      Animated.delay(200),

      // Signature stroke fades in
      Animated.timing(strokeOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),

      // Title slides up and fades in
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),

      // Hold for a moment
      Animated.delay(600),

      // Fade out everything
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]);

    sequence.start(() => {
      onAnimationComplete?.();
    });

    return () => {
      sequence.stop();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {/* Subtle radial glow effect */}
      <Animated.View
        style={[
          styles.glowContainer,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          }
        ]}
      >
        <View style={styles.glow} />
      </Animated.View>

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

          {/* Pen - wrapped in Animated.View for animation */}
          <G transform="translate(142, 28) rotate(-45)">
            <AnimatedG style={{ opacity: penOpacity }}>
              {/* Shaft */}
              <Rect x={-7} y={-42} width={14} height={38} rx={2} fill="url(#penGrad)" />
              {/* Band */}
              <Rect x={-8} y={-6} width={16} height={4} rx={1} fill="#ADA6FF" />
              {/* Nib */}
              <Polygon points="-7,-2 7,-2 2,14 -2,14" fill="#C4BFFF" />
              {/* Tip */}
              <Polygon points="-2,14 2,14 0,22" fill="#E0DDFF" />
            </AnimatedG>
          </G>

          {/* Signature stroke */}
          <AnimatedPath
            d="M 10,130 C 40,100 70,90 95,100 C 120,110 110,135 135,125 C 155,117 160,98 178,92"
            stroke="url(#strokeGrad)"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: strokeOpacity }}
          />

          {/* Tail flick */}
          <AnimatedPath
            d="M 178,92 C 183,88 188,82 186,76"
            stroke={CYAN}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            style={{ opacity: strokeOpacity }}
          />

          {/* Start dot */}
          <AnimatedCircle
            cx={10}
            cy={130}
            r={2.5}
            fill={PURPLE}
            style={{ opacity: strokeOpacity }}
          />
        </Svg>
      </View>

      {/* App name */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }
        ]}
      >
        <Text style={styles.titleWhite}>Sign</Text>
        <Text style={styles.titleGradient}>Snap</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        SIGN ANYWHERE
      </Animated.Text>
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
    opacity: 0.1,
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
    color: PURPLE,
  },
  tagline: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 4,
    color: '#6B6B8D',
  },
});
