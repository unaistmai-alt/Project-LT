import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useStore, useTheme } from '../lib/store';
import { F, HEART_GRADIENT } from '../lib/theme';
import { prettyCode, timeAgo } from '../lib/format';
import { Card, IconCircle, PulseDot, SectionTitle } from '../components/UI';
import ConfirmModal from '../components/ConfirmModal';
import FloatingHearts from '../components/FloatingHearts';

export default function PairScreen() {
  const { colors, dark } = useTheme();
  const store = useStore();
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);

  const code = store.room ?? '';

  const copyCode = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `Lovetouch — എന്റെ പ്രിയപ്പെട്ടയാളേ! ഈ കോഡ് ഉപയോഗിച്ച് ആപ്പിൽ ചേരൂ: ${code}`,
      });
    } catch {
      // user dismissed
    }
  };

  const runTest = async () => {
    setTestResult(null);
    const ok = await store.testSignal();
    setTestResult(
      ok ? 'സിഗ്നൽ അയച്ചു — കണക്ഷൻ ശരിയാണ് ✔' : 'സിഗ്നൽ എത്തിയില്ല — ഇന്റർനെറ്റ് പരിശോധിക്കുക',
    );
    setTimeout(() => setTestResult(null), 4000);
  };

  const steps = [
    'ഒരാൾ “റൂം ഉണ്ടാക്കുക” അമർത്തി കോഡ് ലഭിക്കും',
    'ആ കോഡ് മെസ്സേജ് ചെയ്തോ വിളിച്ചോ പങ്കാളിക്ക് അയക്കുക',
    'പങ്കാളി “കോഡ് ഉപയോഗിച്ച് ചേരുക” തിരഞ്ഞെടുത്ത് അത് ടൈപ്പ് ചെയ്യുക',
    'ഇനി രണ്ടുപേരും ഹൃദയം തൊട്ടാൽ — മറ്റേ ഫോണിൽ വൈബ്രേറ്റ് ചെയ്യും!',
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FloatingHearts color={dark ? '#FF6B94' : '#FFB3C6'} opacity={dark ? 0.1 : 0.18} count={5} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>കണക്ഷൻ</Text>
          <Text style={[styles.subtitle, { color: colors.sub }]}>
            ഈ കോഡ് പങ്കാളിയുമായി പങ്കുവയ്ക്കുക
          </Text>

          <LinearGradient
            colors={HEART_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.codeCard}
          >
            <Text style={styles.codeCardLabel}>റൂം കോഡ്</Text>
            <Text style={styles.codeCardValue}>{prettyCode(code)}</Text>
            <View style={styles.codeActions}>
              <Pressable onPress={copyCode} style={styles.codeBtn}>
                <Ionicons name={copied ? 'checkmark-circle' : 'copy'} size={17} color="#FFFFFF" />
                <Text style={styles.codeBtnText}>{copied ? 'പകർത്തിയില്ല' : 'പകർത്തുക'}</Text>
              </Pressable>
              <View style={styles.codeDivider} />
              <Pressable onPress={shareCode} style={styles.codeBtn}>
                <Ionicons name="share-social" size={17} color="#FFFFFF" />
                <Text style={styles.codeBtnText}>പങ്കുവയ്ക്കുക</Text>
              </Pressable>
            </View>
          </LinearGradient>

          <Card colors={colors} style={{ marginTop: 18 }}>
            <SectionTitle colors={colors}>പങ്കാളി</SectionTitle>
            <View style={styles.partnerRow}>
              {store.online ? (
                <PulseDot color={colors.success} size={10} />
              ) : (
                <View
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 6,
                    backgroundColor: store.partnerLastSeen ? colors.faint : colors.border,
                  }}
                />
              )}
              <Text style={[styles.partnerStatus, { color: colors.text }]}>
                {store.online
                  ? 'പങ്കാളി ലൈവ് ആണ്'
                  : store.partnerLastSeen
                    ? `അവസാന പ്രവർത്തനം: ${timeAgo(store.partnerLastSeen)}`
                    : 'ഇതുവരെ പങ്കാളിയെ കണ്ടിട്ടില്ല'}
              </Text>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.sub }]}>പങ്കാളിയുടെ പേര്</Text>
            <TextInput
              value={store.partnerName}
              onChangeText={store.setPartnerName}
              placeholder="ഉദാ: റിയ"
              placeholderTextColor={colors.faint}
              maxLength={20}
              style={[
                styles.input,
                { backgroundColor: colors.cardAlt, borderColor: colors.border, color: colors.text },
              ]}
              returnKeyType="done"
            />
            <Pressable
              onPress={runTest}
              style={({ pressed }) => [
                styles.testBtn,
                {
                  backgroundColor: pressed ? colors.primary : `${colors.primary}14`,
                  borderColor: `${colors.primary}55`,
                },
              ]}
            >
              {({ pressed }) => (
                <>
                  <Ionicons
                    name="radio"
                    size={17}
                    color={pressed ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.testText,
                      { color: pressed ? '#FFFFFF' : colors.primary },
                    ]}
                  >
                    സിഗ്നൽ ടെസ്റ്റ് ചെയ്യുക
                  </Text>
                </>
              )}
            </Pressable>
            {testResult ? (
              <Text style={[styles.testResult, { color: colors.sub }]}>{testResult}</Text>
            ) : null}
          </Card>

          <Card colors={colors} style={{ marginTop: 16 }}>
            <SectionTitle colors={colors}>എങ്ങനെ ചേരും?</SectionTitle>
            {steps.map((s, i) => (
              <View key={s} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: `${colors.primary}16` }]}>
                  <Text style={[styles.stepNumText, { color: colors.primary }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.sub }]}>{s}</Text>
              </View>
            ))}
          </Card>

          <Card colors={colors} style={{ marginTop: 16 }}>
            <View style={styles.dangerRow}>
              <IconCircle
                name="refresh"
                colors={colors}
                bg={`${colors.danger}18`}
                fg={colors.danger}
                size={40}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.dangerTitle, { color: colors.text }]}>പുതിയ റൂം ഉണ്ടാക്കുക</Text>
                <Text style={[styles.dangerSub, { color: colors.sub }]}>
                  പഴയ കോഡും ഓർമ്മകളും മാറും. പങ്കാളിയെ പുതിയ കോഡ് അറിയിക്കണം.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setConfirmNew(true)}
              style={({ pressed }) => [
                styles.dangerBtn,
                { borderColor: colors.danger, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Text style={[styles.dangerBtnText, { color: colors.danger }]}>പുതിയ കോഡ് ഉണ്ടാക്കുക</Text>
            </Pressable>
          </Card>
        </ScrollView>
      </SafeAreaView>

      <ConfirmModal
        visible={confirmNew}
        colors={colors}
        icon="refresh"
        title="പുതിയ റൂം ഉണ്ടാക്കണോ?"
        message="ഇപ്പോഴത്തെ കോഡ് മാറും, എല്ലാ ഓർമ്മകളും മായും. പങ്കാളിയെ പുതിയ കോഡ് നൽകണം."
        confirmLabel="ഉണ്ടാക്കുക"
        destructive
        onCancel={() => setConfirmNew(false)}
        onConfirm={() => {
          setConfirmNew(false);
          store.createRoom();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 44,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 26,
    textAlign: 'left',
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 13.5,
    textAlign: 'left',
    marginTop: 3,
    marginBottom: 18,
  },
  codeCard: {
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#FF4D80',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  codeCardLabel: {
    fontFamily: F.semibold,
    fontSize: 12.5,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.85)',
  },
  codeCardValue: {
    fontFamily: F.bold,
    fontSize: 34,
    letterSpacing: 6,
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 20,
  },
  codeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
  },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  codeBtnText: {
    fontFamily: F.semibold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  codeDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  partnerStatus: {
    fontFamily: F.semibold,
    fontSize: 14.5,
  },
  fieldLabel: {
    fontFamily: F.semibold,
    fontSize: 12.5,
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15.5,
    fontFamily: F.regular,
    textAlign: 'left',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 13,
    marginTop: 14,
  },
  testText: {
    fontFamily: F.semibold,
    fontSize: 14.5,
  },
  testResult: {
    fontFamily: F.regular,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 10,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 7,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    fontFamily: F.bold,
    fontSize: 12.5,
  },
  stepText: {
    fontFamily: F.regular,
    fontSize: 13.5,
    lineHeight: 20,
    flex: 1,
    textAlign: 'left',
  },
  dangerRow: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
    marginBottom: 14,
  },
  dangerTitle: {
    fontFamily: F.semibold,
    fontSize: 15.5,
    textAlign: 'left',
    marginBottom: 2,
  },
  dangerSub: {
    fontFamily: F.regular,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'left',
  },
  dangerBtn: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dangerBtnText: {
    fontFamily: F.semibold,
    fontSize: 14.5,
  },
});
