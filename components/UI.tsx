import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { F } from '../lib/theme';
import type { ThemeColors } from '../lib/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

export function Card({
  children,
  colors,
  style,
}: {
  children: React.ReactNode;
  colors: ThemeColors;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.primary,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: ThemeColors;
}) {
  return <Text style={[styles.sectionTitle, { color: colors.sub }]}>{children}</Text>;
}

/** Presence dot that breathes while the partner is online. */
export function PulseDot({ color, size = 9 }: { color: string; size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={{ width: size * 2.4, height: size * 2.4, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 2.4,
          height: size * 2.4,
          borderRadius: size * 1.2,
          backgroundColor: color,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] }) }],
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function StatusPill({
  colors,
  label,
  tone,
}: {
  colors: ThemeColors;
  label: string;
  tone: 'live' | 'offline' | 'connecting';
}) {
  const dotColor =
    tone === 'live' ? colors.success : tone === 'offline' ? colors.danger : colors.faint;
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: colors.mode === 'dark' ? colors.cardAlt : colors.cardAlt,
          borderColor: colors.border,
        },
      ]}
    >
      {tone === 'live' ? (
        <PulseDot color={dotColor} />
      ) : (
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: dotColor }} />
      )}
      <Text style={[styles.pillText, { color: colors.sub }]}>{label}</Text>
    </View>
  );
}

export function IconCircle({
  name,
  colors,
  bg,
  fg,
  size = 42,
}: {
  name: IconName;
  colors: ThemeColors;
  bg: string;
  fg: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={size * 0.5} color={fg} />
    </View>
  );
}

export function StatBox({
  colors,
  value,
  label,
  icon,
  flex,
}: {
  colors: ThemeColors;
  value: string;
  label: string;
  icon: IconName;
  flex?: number;
}) {
  return (
    <View style={[styles.statBox, { flex: flex ?? 1 }]}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.sub }]}>{label}</Text>
    </View>
  );
}

export function ErrorMessage({
  colors,
  text,
}: {
  colors: ThemeColors;
  text: string | null;
}) {
  if (!text) return null;
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle" size={15} color={colors.danger} />
      <Text style={[styles.errorText, { color: colors.danger }]}>{text}</Text>
    </View>
  );
}

export const textStyles = (colors: ThemeColors) =>
  ({
    h1: { fontFamily: F.bold, fontSize: 30, color: colors.text } as TextStyle,
    h2: { fontFamily: F.semibold, fontSize: 20, color: colors.text } as TextStyle,
    body: { fontFamily: F.regular, fontSize: 15, color: colors.text } as TextStyle,
    sub: { fontFamily: F.regular, fontSize: 13, color: colors.sub } as TextStyle,
  });

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: {
    fontFamily: F.semibold,
    fontSize: 12.5,
    letterSpacing: 0.6,
    marginBottom: 10,
    textAlign: 'left',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: F.semibold,
    fontSize: 12,
  },
  statBox: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  statValue: {
    fontFamily: F.bold,
    fontSize: 19,
  },
  statLabel: {
    fontFamily: F.regular,
    fontSize: 11.5,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: F.medium,
    fontSize: 13,
  },
});
