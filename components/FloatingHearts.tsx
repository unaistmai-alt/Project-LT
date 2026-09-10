import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  count?: number;
  color?: string;
  opacity?: number;
  minSize?: number;
  maxSize?: number;
};

type Seed = {
  key: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  outline: boolean;
};

export default function FloatingHearts({
  count = 8,
  color = '#FF7AA2',
  opacity = 0.3,
  minSize = 14,
  maxSize = 28,
}: Props) {
  const { height, width } = useMemo(() => Dimensions.get('window'), []);
  const seeds = useMemo<Seed[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        left: Math.random() * Math.max(10, width - maxSize),
        size: minSize + Math.random() * (maxSize - minSize),
        duration: 9000 + Math.random() * 8000,
        delay: Math.random() * 7000,
        drift: (Math.random() - 0.5) * 70,
        outline: i % 3 === 0,
      })),
    [count, width, minSize, maxSize],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {seeds.map((seed) => (
        <FloatingHeart
          key={seed.key}
          seed={seed}
          height={height}
          color={color}
          opacity={opacity}
        />
      ))}
    </View>
  );
}

function FloatingHeart({
  seed,
  height,
  color,
  opacity,
}: {
  seed: Seed;
  height: number;
  color: string;
  opacity: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(seed.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: seed.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, seed.delay, seed.duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [height + 40, -80],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, seed.drift, 0],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', seed.drift > 0 ? '24deg' : '-24deg'],
  });
  const fade = progress.interpolate({
    inputRange: [0, 0.15, 0.8, 1],
    outputRange: [0, opacity, opacity, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: seed.left,
        bottom: 0,
        opacity: fade,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    >
      <Ionicons
        name={seed.outline ? 'heart-outline' : 'heart'}
        size={seed.size}
        color={color}
      />
    </Animated.View>
  );
}
