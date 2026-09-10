import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { F } from '../lib/theme';
import type { ThemeColors } from '../lib/theme';
import type { IconName } from './UI';

type Props = {
  visible: boolean;
  colors: ThemeColors;
  icon: IconName;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  colors,
  icon,
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const accent = destructive ? colors.danger : colors.primary;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
            <Ionicons name={icon} size={26} color={accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.sub }]}>{message}</Text>
          <View style={styles.row}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                { borderColor: colors.border, backgroundColor: colors.cardAlt, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>വേണ്ട</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: accent, borderColor: accent, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 6, 14, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 26,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 19,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: F.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: F.semibold,
    fontSize: 15,
  },
});
