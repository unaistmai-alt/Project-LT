import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore, useTheme } from '../lib/store';
import { F, SOFT_GRADIENT, SOFT_GRADIENT_DARK } from '../lib/theme';
import FloatingHearts from '../components/FloatingHearts';
import { ErrorMessage } from '../components/UI';

type Mode = 'create' | 'join';

export default function WelcomeScreen() {
  const { colors, dark } = useTheme();
  const { joinRoom, name } = useStore();
  const [mode, setMode] = useState<Mode>('create');
  const [display, setDisplay] = useState(name || '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineNote, setOfflineNote] = useState<string | null>(null);

  const onCreate = async () => {
    if (busy) return;
    setError(null);
    setOfflineNote(null);
    const cleanName = display.trim();
    if (cleanName.length === 0) {
      setError('ദയവായി നിങ്ങളുടെ പേര് എഴുതുക');
      return;
    }
    setBusy(true);
    try {
      const ok = await joinRoom(randomFallback(), cleanName);
      if (!ok) {
        setOfflineNote('ഇന്റർനെറ്റില്ല — റൂം തുറന്നു, പിന്നീട് കണക്ട് ചെയ്യാം.');
      }
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async () => {
    if (busy) return;
    setError(null);
    setOfflineNote(null);
    const cleanName = display.trim();
    if (cleanName.length === 0) {
      setError('ദയവായി നിങ്ങളുടെ പേര് എഴുതുക');
      return;
    }
    if (code.trim().replace(/[^A-Za-z0-9]/g, '').length < 4) {
      setError('കുറഞ്ഞത് 4 അക്ഷരമുള്ള കോഡ് ആവശ്യമാണ്');
      return;
    }
    setBusy(true);
    try {
      const ok = await joinRoom(code, cleanName);
      if (!ok) {
        setOfflineNote('ഇന്റർനെറ്റില്ല — റൂം തുറന്നു, പിന്നീട് കണക്ട് ചെയ്യാം.');
      }
    } finally {
      setBusy(false);
    }
  };

  const steps = [
    { icon: 'add-circle' as const, text: 'ഒരാൾ പുതിയ റൂം ഉണ്ടാക്കുക' },
    { icon: 'paper-plane' as const, text: 'ലഭിച്ച കോഡ് പങ്കാളിക്ക് അയക്കുക' },
    { icon: 'phone-portrait' as const, text: 'പങ്കാളി ആ കോഡ് ടൈപ്പ് ചെയ്ത് ചേരുക' },
  ];

  return (
    <LinearGradient
      colors={dark ? SOFT_GRADIENT_DARK : SOFT_GRADIENT}
      style={{ flex: 1 }}
    >
      <FloatingHearts color={dark ? '#FF6B94' : '#FF8FAC'} opacity={dark ? 0.2 : 0.35} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <LinearGradient
                colors={['#FF8FAC', '#FF4D80', '#E63A6B']}
                style={styles.logo}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
              >
                <Ionicons name="heart" size={44} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.title, { color: colors.primary }]}>Lovetouch</Text>
              <Text style={[styles.tagline, { color: colors.sub }]}>
                ദൂരെയുള്ള പ്രിയപ്പെട്ടയാളുടെ ഹൃദയം തൊടാം
              </Text>
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.label, { color: colors.sub }]}>നിങ്ങളുടെ പേര്</Text>
              <TextInput
                value={display}
                onChangeText={setDisplay}
                placeholder="ഉദാ: അമൂൽ, റിയ"
                placeholderTextColor={colors.faint}
                style={[
                  styles.input,
                  { backgroundColor: colors.cardAlt, borderColor: colors.border, color: colors.text },
                ]}
                returnKeyType="done"
                maxLength={20}
              />

              <View style={styles.segment}>
                {(['create', 'join'] as Mode[]).map((m) => {
                  const active = mode === m;
                  return (
                    <View key={m} style={{ flex: 1 }}>
                      <Text
                        onPress={() => {
                          setMode(m);
                          setError(null);
                          setOfflineNote(null);
                        }}
                        style={[
                          styles.segmentItem,
                          {
                            backgroundColor: active ? colors.primary : colors.cardAlt,
                            color: active ? '#FFFFFF' : colors.sub,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        {m === 'create' ? 'പുതിയ റൂം' : 'കോഡ് ഉപയോഗിച്ച് ചേരുക'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {mode === 'join' ? (
                <>
                  <Text style={[styles.label, { color: colors.sub, marginTop: 16 }]}>
                    റൂം കോഡ്
                  </Text>
                  <TextInput
                    value={code}
                    onChangeText={(v) => setCode(v.toUpperCase().slice(0, 10))}
                    placeholder="ABCD1234"
                    placeholderTextColor={colors.faint}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      styles.codeInput,
                      {
                        backgroundColor: colors.cardAlt,
                        borderColor: colors.primary,
                        color: colors.text,
                      },
                    ]}
                    returnKeyType="go"
                    onSubmitEditing={onJoin}
                  />
                </>
              ) : (
                <Text style={[styles.createHint, { color: colors.sub }]}>
                  ഒരു പുതിയ കോഡ് ഉണ്ടാക്കി അത് പങ്കാളിക്ക് അയക്കും
                </Text>
              )}

              <ErrorMessage colors={colors} text={error} />

              <Pressable
                onPress={mode === 'create' ? onCreate : onJoin}
                disabled={busy}
                style={({ pressed }) => [
                  styles.cta,
                  {
                    backgroundColor: colors.primary,
                    opacity: busy ? 0.7 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.ctaText}>
                    {mode === 'create' ? 'റൂം ഉണ്ടാക്കുക' : 'കണക്റ്റ് ചെയ്യുക'}
                  </Text>
                )}
              </Pressable>
              {offlineNote ? (
                <View style={styles.offlineRow}>
                  <Ionicons name="cloud-offline" size={15} color={colors.danger} />
                  <Text style={[styles.offlineText, { color: colors.danger }]}>{offlineNote}</Text>
                </View>
              ) : null}
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 },
              ]}
            >
              <Text style={[styles.stepsTitle, { color: colors.text }]}>എങ്ങനെ പ്രവർത്തിക്കുന്നു?</Text>
              {steps.map((s, i) => (
                <View key={s.text} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: colors.cardAlt }]}>
                    <Text style={[styles.stepNumText, { color: colors.primary }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.sub }]}>{s.text}</Text>
                  <Ionicons name={s.icon} size={17} color={colors.faint} />
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function randomFallback(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i += 1) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4D80',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    marginBottom: 16,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 36,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: F.regular,
    fontSize: 14.5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#FF4D80',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  label: {
    fontFamily: F.semibold,
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    fontSize: 16,
    fontFamily: F.regular,
    marginBottom: 4,
  },
  codeInput: {
    fontFamily: F.bold,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 8,
  },
  createHint: {
    fontFamily: F.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 6,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  segmentItem: {
    fontFamily: F.semibold,
    fontSize: 13.5,
    textAlign: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cta: {
    borderRadius: 18,
    marginTop: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#FF4D80',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaText: {
    fontFamily: F.bold,
    fontSize: 16.5,
    color: '#FFFFFF',
  },
  offlineRow: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  offlineText: {
    fontFamily: F.medium,
    fontSize: 12.5,
    flexShrink: 1,
    textAlign: 'center',
  },
  stepsTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    marginBottom: 14,
    textAlign: 'left',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  stepText: {
    fontFamily: F.regular,
    fontSize: 14,
    flex: 1,
    textAlign: 'left',
  },
});
