import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { HEART_GRADIENT, makeShadow } from '../lib/theme';
import type { Gradient } from '../lib/theme';
import type { TouchKind } from '../lib/ntfy';

const ICONS: Record<TouchKind, keyof typeof Ionicons.glyphMap> = {
  heart: 'heart',
  hug: 'body',
  kiss: 'sparkles',
};

type Props = {
  size?: number;
  kind?: TouchKind;
  color?: string;
  gradient?: Gradient;
  dark?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  pulsing?: boolean;
};

export default function HeartButton({
  size = 210,
  kind = 'heart',
  color = '#FF4D80',
  gradient = HEART_GRADIENT,
  dark = false,
  onPress,
  onLongPress,
  pulsing = true,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulsing) return;
    const make = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 2600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    const loops = [make(ring1, 0), make(ring2, 850), make(ring3, 1700)];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [pulsing, ring1, ring2, ring3]);

  const pop = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.86, speed: 40, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const ringStyle = (val: Animated.Value) => ({
    position: 'absolute' as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: color,
    transform: [
      {
        scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }),
      },
    ],
    opacity: val.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.5, 0.28, 0] }),
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => {
        pop();
        onPress();
      }}
      onLongPress={onLongPress}
      delayLongPress={420}
      accessibilityRole="button"
      accessibilityLabel="Send a touch"
    >
      <View style={[styles.wrap, { width: size * 1.42, height: size * 1.42 }]}>
        <Animated.View style={ringStyle(ring1)} />
        <Animated.View style={ringStyle(ring2)} />
        <Animated.View style={ringStyle(ring3)} />
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[
              styles.core,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                ...makeShadow(color, dark, 26),
              },
            ]}
          >
            <Ionicons name={ICONS[kind]} size={size * 0.42} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
