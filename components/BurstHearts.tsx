import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TouchKind } from '../lib/ntfy';

const ICONS: Record<TouchKind, keyof typeof Ionicons.glyphMap> = {
  heart: 'heart',
  hug: 'body',
  kiss: 'sparkles',
};

type Particle = {
  key: number;
  val: Animated.Value;
  left: number;
  size: number;
  dx: number;
  dy: number;
};

type Props = {
  trigger: number;
  kind?: TouchKind;
  color?: string;
  originY?: number;
};

/** Flying hearts spawned on every send / receive. */
export default function BurstHearts({ trigger, kind = 'heart', color = '#FF4D80', originY }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const { width } = Dimensions.get('window');
    const fresh: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      key: trigger * 100 + i,
      val: new Animated.Value(0),
      left: width / 2 - 12 + (Math.random() - 0.5) * 120,
      size: 16 + Math.random() * 20,
      dx: (Math.random() - 0.5) * 170,
      dy: -140 - Math.random() * 150,
    }));
    setParticles((prev) => [...prev, ...fresh]);
    const anim = Animated.stagger(
      45,
      fresh.map((p) =>
        Animated.timing(p.val, {
          toValue: 1,
          duration: 1150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );
    anim.start(() => {
      const keys = new Set(fresh.map((p) => p.key));
      setParticles((prev) => prev.filter((p) => !keys.has(p.key)));
    });
  }, [trigger]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Animated.View
          key={p.key}
          style={{
            position: 'absolute',
            left: p.left,
            top: originY ?? '42%',
            opacity: p.val.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateY: p.val.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }) },
              { translateX: p.val.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              { scale: p.val.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 1.1, 0.8] }) },
            ],
          }}
        >
          <Ionicons name={ICONS[kind]} size={p.size} color={color} />
        </Animated.View>
      ))}
    </View>
  );
}
