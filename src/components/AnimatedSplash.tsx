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

// Measured lengths of the signature paths (see design notes). A touch above the
// true length so the stroke reveals fully when the dash offset reaches zero.
const STROKE_LEN = 204;
const TAIL_LEN = 20;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;

  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.85)).current;

  const penOpacity = useRef(new Animated.Value(0)).current;
  const penScale = useRef(new Animated.Value(0.9)).current;

  // Signature "draw-on": animate the dash offset from full length → 0 so the
  // ink appears to be written by hand. (JS-driven: strokeDashoffset isn't
  // supported by the native driver.)
  const strokeDraw = useRef(new Animated.Value(STROKE_LEN)).current;
  const tailDraw = useRef(new Animated.Value(TAIL_LEN)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  // Text reveals with a soft fade + slight scale-up — a gentle "materialize"
  // rather than a translate-based fly-in.
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.94)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.delay(80),

      // Ambient glow + pen quietly fade/scale in together
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(penOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(penScale, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),

      // Ink starting point
      Animated.timing(dotOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),

      // The signature draws itself, the little tail flick finishing last
      Animated.parallel([
        Animated.timing(strokeDraw, {
          toValue: 0,
          duration: 650,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(tailDraw, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease),
          }),
        ]),
      ]),

      // Title then tagline softly materialize (fade + subtle scale)
      Animated.stagger(110, [
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(titleScale, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]),
        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(taglineScale, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]),
      ]),

      // Brief hold
      Animated.delay(320),

      // Fade out everything
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 320,
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

          {/* Pen */}
          <G transform="translate(142, 28) rotate(-45)">
            <AnimatedG style={{ opacity: penOpacity, transform: [{ scale: penScale }] }}>
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

          {/* Start dot */}
          <AnimatedCircle
            cx={10}
            cy={130}
            r={2.5}
            fill={PURPLE}
            style={{ opacity: dotOpacity }}
          />

          {/* Signature stroke — draws on via dash offset */}
          <AnimatedPath
            d="M 10,130 C 40,100 70,90 95,100 C 120,110 110,135 135,125 C 155,117 160,98 178,92"
            stroke="url(#strokeGrad)"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={STROKE_LEN}
            strokeDashoffset={strokeDraw}
          />

          {/* Tail flick */}
          <AnimatedPath
            d="M 178,92 C 183,88 188,82 186,76"
            stroke={CYAN}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={TAIL_LEN}
            strokeDashoffset={tailDraw}
          />
        </Svg>
      </View>

      {/* App name */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ scale: titleScale }],
          }
        ]}
      >
        <Text style={styles.titleWhite}>Sign</Text>
        <Text style={styles.titleGradient}>Snap</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ scale: taglineScale }],
          },
        ]}
      >
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
