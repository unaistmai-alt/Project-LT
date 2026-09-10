import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { TouchKind } from './ntfy';

const isWeb = Platform.OS === 'web';

export function hapticSent(kind: TouchKind): void {
  if (isWeb) return;
  try {
    if (kind === 'heart') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } else if (kind === 'hug') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    } else {
      Haptics.selectionAsync().catch(() => {});
      Vibration.vibrate(40);
    }
  } catch {
    // haptics unavailable — silent
  }
}

export function hapticReceived(): void {
  if (isWeb) return;
  try {
    Vibration.vibrate([0, 90, 70, 90, 70, 220]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {
    // silent
  }
}

export function hapticTest(): void {
  if (isWeb) return;
  try {
    Vibration.vibrate([0, 60, 80, 140]);
  } catch {
    // silent
  }
}
