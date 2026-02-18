import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  FlatList,
  ViewToken,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingScreenProps } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ONBOARDING_KEY = 'hasCompletedOnboarding';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  gradientColors: [string, string];
  accentColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    emoji: '⚡',
    title: 'Save Time',
    subtitle: 'Sign in Seconds',
    description: 'No more printing, signing, and scanning. Sign any document digitally in under 30 seconds.',
    gradientColors: ['#6C63FF', '#8B7FFF'],
    accentColor: '#6C63FF',
  },
  {
    id: '2',
    emoji: '✍️',
    title: 'Easy Signatures',
    subtitle: 'Draw, Type, or Upload',
    description: 'Create your perfect signature by drawing it, typing your name, or uploading an existing one.',
    gradientColors: ['#00D9FF', '#00B8D9'],
    accentColor: '#00D9FF',
  },
  {
    id: '3',
    emoji: '📱',
    title: 'Power in Your Pocket',
    subtitle: 'Sign Anywhere, Anytime',
    description: 'Your signature studio fits in your pocket. Sign contracts, forms, and documents wherever you are.',
    gradientColors: ['#8B7FFF', '#A599FF'],
    accentColor: '#8B7FFF',
  },
];

// Floating particle component
interface ParticleProps {
  delay: number;
  startX: number;
  startY: number;
  size: number;
  duration: number;
  color: string;
}

function Particle({ delay, startX, startY, size, duration, color }: ParticleProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in
    opacity.value = withDelay(delay, withTiming(0.4, { duration: 2000 }));

    // Gentle float animation
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(10, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(-10, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// Floating orb with glow effect
interface GlowOrbProps {
  delay: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

function GlowOrb({ delay, x, y, size, color }: GlowOrbProps) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 2000 }));
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value * 0.2,
  }));

  return (
    <Animated.View
      style={[
        styles.glowOrb,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// Animated ring component
interface RingProps {
  delay: number;
  size: number;
  color: string;
}

function AnimatedRing({ delay, size, color }: RingProps) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 3000, easing: Easing.out(Easing.ease) }),
          withTiming(0.6, { duration: 0 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(0, { duration: 2400 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

interface SlideProps {
  slide: OnboardingSlide;
  index: number;
  scrollX: Animated.SharedValue<number>;
}

function Slide({ slide, index, scrollX }: SlideProps) {
  const floatY = useSharedValue(0);
  const iconScale = useSharedValue(0);

  useEffect(() => {
    // Icon entrance animation
    iconScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));

    // Gentle floating animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: iconScale.value },
    ],
  }));

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        {/* Icon container with single ring */}
        <View style={styles.iconWrapper}>
          <AnimatedRing delay={0} size={160} color={slide.accentColor} />

          <Animated.View style={floatStyle}>
            <LinearGradient
              colors={slide.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Text style={styles.emoji}>{slide.emoji}</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: slide.accentColor }]}>{slide.subtitle}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </Animated.View>
    </View>
  );
}

interface PaginationDotProps {
  index: number;
  scrollX: Animated.SharedValue<number>;
}

function PaginationDot({ index, scrollX }: PaginationDotProps) {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 28, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    const backgroundColor = interpolateColor(
      scrollX.value,
      [0, SCREEN_WIDTH, SCREEN_WIDTH * 2],
      ['#6C63FF', '#00D9FF', '#8B7FFF']
    );

    return {
      width,
      opacity,
      backgroundColor,
    };
  });

  return <Animated.View style={[styles.dot, animatedDotStyle]} />;
}

interface PaginationProps {
  slidesCount: number;
  scrollX: Animated.SharedValue<number>;
}

function Pagination({ slidesCount, scrollX }: PaginationProps) {
  return (
    <View style={styles.pagination}>
      {Array.from({ length: slidesCount }).map((_, index) => (
        <PaginationDot key={index} index={index} scrollX={scrollX} />
      ))}
    </View>
  );
}

// Generate random particles using app theme colors - reduced count for subtlety
const generateParticles = () => {
  const particles = [];
  const themeColors = ['#6C63FF', '#8B7FFF', '#00D9FF'];
  for (let i = 0; i < 10; i++) {
    particles.push({
      id: i,
      delay: Math.random() * 3000,
      startX: Math.random() * SCREEN_WIDTH,
      startY: Math.random() * SCREEN_HEIGHT,
      size: Math.random() * 3 + 2,
      duration: Math.random() * 2000 + 4000,
      color: themeColors[Math.floor(Math.random() * themeColors.length)],
    });
  }
  return particles;
};

const PARTICLES = generateParticles();

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);

  // Subtle button glow animation
  useEffect(() => {
    buttonGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(buttonGlow.value, [0, 1], [0.2, 0.5]),
    shadowRadius: interpolate(buttonGlow.value, [0, 1], [8, 16]),
  }));

  // Animated background gradient based on scroll - using app theme colors
  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      [0, SCREEN_WIDTH, SCREEN_WIDTH * 2],
      ['#0F0F1A', '#0D1219', '#12101F']
    );

    return { backgroundColor };
  });

  const handleScroll = (event: any) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('Home');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.replace('Home');
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95, ANIMATION.springBouncy);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, ANIMATION.springBouncy);
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      {/* Animated background elements */}
      <View style={styles.backgroundEffects}>
        {/* Subtle glow orbs */}
        <GlowOrb delay={0} x={SCREEN_WIDTH * 0.15} y={SCREEN_HEIGHT * 0.2} size={250} color="#6C63FF" />
        <GlowOrb delay={800} x={SCREEN_WIDTH * 0.85} y={SCREEN_HEIGHT * 0.7} size={200} color="#00D9FF" />

        {/* Floating particles */}
        {PARTICLES.map((particle) => (
          <Particle
            key={particle.id}
            delay={particle.delay}
            startX={particle.startX}
            startY={particle.startY}
            size={particle.size}
            duration={particle.duration}
            color={particle.color}
          />
        ))}
      </View>

      {/* Skip button */}
      <Animated.View
        entering={FadeIn.delay(500).duration(400)}
        style={styles.skipContainer}
      >
        <Pressable
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Animated.View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <Slide slide={item} index={index} scrollX={scrollX} />
        )}
      />

      {/* Bottom section */}
      <Animated.View
        entering={FadeInUp.delay(600).springify()}
        style={styles.bottomSection}
      >
        <Pagination slidesCount={SLIDES.length} scrollX={scrollX} />

        <AnimatedPressable
          style={[styles.nextButton, buttonAnimatedStyle, buttonGlowStyle]}
          onPress={handleNext}
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Get started' : 'Next slide'}
        >
          <LinearGradient
            colors={SLIDES[currentIndex].gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {isLastSlide ? "Let's Go!" : 'Next'}
            </Text>
            {!isLastSlide && <Text style={styles.nextButtonArrow}>→</Text>}
          </LinearGradient>
        </AnimatedPressable>

        <View style={styles.bottomSpacer} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundEffects: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
  glowOrb: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 10,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.full,
  },
  skipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: SPACING.md,
  },
  bottomSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 50,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  nextButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextButtonArrow: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: SPACING.md,
  },
});

export { ONBOARDING_KEY };
