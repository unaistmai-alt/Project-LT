import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore, useTheme } from '../lib/store';
import type { Memory } from '../lib/store';
import { F } from '../lib/theme';
import type { TouchKind } from '../lib/ntfy';
import { prettyCode, streakOf, timeAgo, todayStart } from '../lib/format';
import FloatingHearts from '../components/FloatingHearts';
import BurstHearts from '../components/BurstHearts';
import HeartButton from '../components/HeartButton';
import { Card, IconCircle, StatusPill, StatBox } from '../components/UI';

const SENT_TEXT: Record<TouchKind, string> = {
  heart: 'സിഗ്നൽ അയച്ചു! ❤️',
  hug: 'ആലിംഗനം അയച്ചു! 🤗',
  kiss: 'ചുംബനം അയച്ചു! 😘',
};

const RECEIVED_TEXT: Record<TouchKind, string> = {
  heart: 'നിങ്ങളുടെ പ്രിയപ്പെട്ടയാൾ ഓർക്കുന്നു! ❤️',
  hug: 'നിങ്ങളുടെ പ്രിയപ്പെട്ടയാൾ കെട്ടിപ്പിടിക്കാൻ ആഗ്രഹിക്കുന്നു! 🤗',
  kiss: 'നിങ്ങളുടെ പ്രിയപ്പെട്ടയാളിൽ നിന്ന് ഒരു ചുംബനം! 😘',
};

const KIND_ICON: Record<TouchKind, keyof typeof Ionicons.glyphMap> = {
  heart: 'heart',
  hug: 'body',
  kiss: 'sparkles',
};

const PRESETS = ['നിന്നെ സ്നേഹിക്കുന്നു ❤️', 'കാണാൻ ആഗ്രഹം 🤗', 'ഉറങ്ങുമ്പോൾ ഓർക്കും 😘'];

type Flash = { text: string; sub?: string; tone: 'sent' | 'recv' | 'warn' };

export default function TouchScreen() {
  const { colors, dark } = useTheme();
  const store = useStore();
  const [flash, setFlash] = useState<Flash | null>(null);
  const [burstSeq, setBurstSeq] = useState(0);
  const [burstKind, setBurstKind] = useState<TouchKind>('heart');
  const [sheet, setSheet] = useState(false);
  const [sheetKind, setSheetKind] = useState<TouchKind>('heart');
  const [note, setNote] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);

  const memories = store.memories;
  const hasRecv = memories.some((m) => m.dir === 'recv');
  const todayCount = memories.filter((m) => m.t >= todayStart()).length;
  const streak = streakOf(memories.map((m) => m.t));
  const lastIncomingSeq = store.lastIncoming?.seq ?? 0;

  const showFlash = (f: Flash) => {
    if (timer.current) clearTimeout(timer.current);
    setFlash(f);
    timer.current = setTimeout(() => setFlash(null), 3600);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // incoming touch celebration
  useEffect(() => {
    if (lastIncomingSeq === 0 || !store.lastIncoming) return;
    const inc = store.lastIncoming;
    setBurstKind(inc.kind);
    setBurstSeq((s) => s + 1);
    showFlash({
      text: RECEIVED_TEXT[inc.kind],
      sub: inc.note ? `“${inc.note}”` : undefined,
      tone: 'recv',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastIncomingSeq]);

  const send = async (kind: TouchKind, withNote?: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBurstKind(kind);
    setBurstSeq((s) => s + 1);
    const ok = await store.sendTouch(kind, withNote);
    showFlash({
      text: ok ? SENT_TEXT[kind] : 'ഓഫ്‌ലൈൻ — കണക്ഷൻ വരുമ്പോൾ എത്തും',
      sub: withNote ? `“${withNote}”` : undefined,
      tone: ok ? 'sent' : 'warn',
    });
    busyRef.current = false;
  };

  const connTone = store.conn === 'live' ? 'live' : store.conn === 'offline' ? 'offline' : 'connecting';
  const connLabel =
    store.conn === 'live'
      ? store.online
        ? 'പങ്കാളി ലൈവ്'
        : 'കണക്റ്റഡ്'
      : store.conn === 'offline'
        ? 'ഓഫ്‌ലൈൻ'
        : 'കണക്ടിംഗ്...';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FloatingHearts color={dark ? '#FF6B94' : '#FF8FAC'} opacity={dark ? 0.16 : 0.26} count={7} />
      <BurstHearts trigger={burstSeq} kind={burstKind} color={colors.primary} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brand, { color: colors.primary }]}>Lovetouch</Text>
              <Text style={[styles.codeText, { color: colors.sub }]}>
                റൂം · {store.room ? prettyCode(store.room) : '—'}
              </Text>
            </View>
            <StatusPill colors={colors} label={connLabel} tone={connTone} />
          </View>

          <View style={styles.heartArea}>
            <HeartButton
              size={200}
              color={colors.primary}
              dark={dark}
              onPress={() => send('heart')}
              onLongPress={() => {
                setSheetKind('heart');
                setSheet(true);
              }}
            />
          </View>

          <View style={{ minHeight: 78, alignItems: 'center' }}>
            {flash ? (
              <>
                <View
                  style={[
                    styles.flashPill,
                    {
                      backgroundColor:
                        flash.tone === 'warn'
                          ? `${colors.danger}1A`
                          : flash.tone === 'recv'
                            ? `${colors.success}1A`
                            : `${colors.primary}1A`,
                      borderColor:
                        flash.tone === 'warn'
                          ? `${colors.danger}55`
                          : flash.tone === 'recv'
                            ? `${colors.success}55`
                            : `${colors.primary}55`,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      flash.tone === 'recv'
                        ? 'radio'
                        : flash.tone === 'warn'
                          ? 'cloud-offline'
                          : 'paper-plane'
                    }
                    size={16}
                    color={
                      flash.tone === 'warn'
                        ? colors.danger
                        : flash.tone === 'recv'
                          ? colors.success
                          : colors.primary
                    }
                  />
                  <Text
                    style={[
                      styles.flashText,
                      {
                        color:
                          flash.tone === 'warn'
                            ? colors.danger
                            : flash.tone === 'recv'
                              ? colors.success
                              : colors.primary,
                      },
                    ]}
                  >
                    {flash.text}
                  </Text>
                </View>
                {flash.sub ? <Text style={[styles.flashNote, { color: colors.sub }]}>{flash.sub}</Text> : null}
              </>
            ) : (
              <Text style={[styles.hint, { color: colors.sub }]}>
                ഹൃദയം തൊടുക — സ്നേഹം അയയ്ക്കാം
                {'\n'}അമർത്തിപ്പിടിക്കുക — കൂടുതൽ ഓപ്ഷനുകൾ
              </Text>
            )}
          </View>

          {!hasRecv ? (
            <Card colors={colors} style={{ marginTop: 8 }}>
              <View style={styles.waitRow}>
                <IconCircle
                  name="hourglass"
                  colors={colors}
                  bg={`${colors.primary}1A`}
                  fg={colors.primary}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.waitTitle, { color: colors.text }]}>
                    പങ്കാളിക്കായി കാത്തിരിക്കുന്നു
                  </Text>
                  <Text style={[styles.waitSub, { color: colors.sub }]}>
                    ഈ കോഡ് പങ്കാളിയുടെ ഫോണിൽ ടൈപ്പ് ചെയ്യാൻ പറയുക — കണക്ഷൻ പേജിൽ നിന്ന് കോഡ് പകർത്താം.
                  </Text>
                </View>
              </View>
            </Card>
          ) : (
            <Card colors={colors} style={{ marginTop: 8 }}>
              <View style={styles.statsRow}>
                <StatBox colors={colors} value={String(todayCount)} label="ഇന്ന്" icon="flame" />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <StatBox colors={colors} value={String(memories.length)} label="ആകെ" icon="heart-circle" />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <StatBox
                  colors={colors}
                  value={`${streak}`}
                  label="തുടർച്ച (ദിവസം)"
                  icon="calendar"
                />
              </View>
            </Card>
          )}

          <Text style={[styles.chipsTitle, { color: colors.sub }]}>
            വേഗം സ്പർശിക്കാം
          </Text>
          <View style={styles.chips}>
            {PRESETS.map((p) => (
              <Pressable
                key={p}
                onPress={() => send('heart', p)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: pressed ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.chipText,
                      { color: pressed ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {p}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          {memories.length > 0 ? (
            <View style={{ marginTop: 22 }}>
              <Text style={[styles.recentTitle, { color: colors.sub }]}>അവസാന സ്പർശനം</Text>
              <RecentRow colors={colors} m={memories[0]} partnerName={store.partnerName} />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {/* quick note / kind sheet */}
      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheet(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>എന്താണ് അയയ്ക്കേണ്ടത്?</Text>
            <View style={styles.kindRow}>
              {(['heart', 'hug', 'kiss'] as TouchKind[]).map((k) => {
                const active = sheetKind === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setSheetKind(k)}
                    style={[
                      styles.kindTile,
                      {
                        backgroundColor: active ? `${colors.primary}1A` : colors.cardAlt,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={KIND_ICON[k]}
                      size={26}
                      color={active ? colors.primary : colors.sub}
                    />
                    <Text
                      style={[
                        styles.kindLabel,
                        { color: active ? colors.primary : colors.sub },
                      ]}
                    >
                      {k === 'heart' ? 'ഹൃദയം' : k === 'hug' ? 'ആലിംഗനം' : 'ചുംബനം'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="ഒരു ചെറിയ സന്ദേശം (കോഡ്)..."
              placeholderTextColor={colors.faint}
              maxLength={60}
              style={[
                styles.noteInput,
                { backgroundColor: colors.cardAlt, borderColor: colors.border, color: colors.text },
              ]}
              returnKeyType="send"
              onSubmitEditing={() => {
                setSheet(false);
                send(sheetKind, note.trim() || undefined);
                setNote('');
              }}
            />
            <Pressable
              onPress={() => {
                setSheet(false);
                send(sheetKind, note.trim() || undefined);
                setNote('');
              }}
              style={({ pressed }) => [
                styles.sheetSend,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.sheetSendText}>അയയ്ക്കുക</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function RecentRow({
  colors,
  m,
  partnerName,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  m: Memory;
  partnerName: string;
}) {
  const mine = m.dir === 'sent';
  const who = mine ? 'നിങ്ങൾ' : m.from || partnerName || 'പ്രിയപ്പെട്ടയാൾ';
  const verb = m.kind === 'heart' ? 'ഹൃദയം അയച്ചു' : m.kind === 'hug' ? 'ആലിംഗനം അയച്ചു' : 'ചുംബനം അയച്ചു';
  return (
    <View style={[styles.recentRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
      <IconCircle
        name={mine ? 'arrow-up' : 'arrow-down'}
        colors={colors}
        bg={mine ? `${colors.primary}22` : `${colors.success}22`}
        fg={mine ? colors.primary : colors.success}
        size={36}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.recentText, { color: colors.text }]}>
          {who} {verb}
        </Text>
        {m.note ? <Text style={[styles.recentNote, { color: colors.sub }]}>“{m.note}”</Text> : null}
      </View>
      <Ionicons name={KIND_ICON[m.kind]} size={18} color={colors.primary} />
      <Text style={[styles.recentTime, { color: colors.faint }]}>{timeAgo(m.t)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  brand: {
    fontFamily: F.bold,
    fontSize: 22,
    textAlign: 'left',
  },
  codeText: {
    fontFamily: F.medium,
    fontSize: 12.5,
    letterSpacing: 1,
    textAlign: 'left',
    marginTop: 2,
  },
  heartArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
  },
  flashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  flashText: {
    fontFamily: F.semibold,
    fontSize: 14.5,
    flexShrink: 1,
    textAlign: 'center',
  },
  flashNote: {
    fontFamily: F.regular,
    fontSize: 13,
    marginTop: 8,
  },
  hint: {
    fontFamily: F.regular,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 21,
  },
  waitRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  waitTitle: {
    fontFamily: F.semibold,
    fontSize: 15.5,
    textAlign: 'left',
    marginBottom: 3,
  },
  waitSub: {
    fontFamily: F.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'left',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 34,
    opacity: 0.7,
  },
  chipsTitle: {
    fontFamily: F.semibold,
    fontSize: 12.5,
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
    textAlign: 'left',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: F.medium,
    fontSize: 13,
  },
  recentTitle: {
    fontFamily: F.semibold,
    fontSize: 12.5,
    letterSpacing: 0.5,
    marginBottom: 9,
    textAlign: 'left',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  recentText: {
    fontFamily: F.semibold,
    fontSize: 14,
    textAlign: 'left',
  },
  recentNote: {
    fontFamily: F.regular,
    fontSize: 12.5,
    textAlign: 'left',
    marginTop: 2,
  },
  recentTime: {
    fontFamily: F.regular,
    fontSize: 11.5,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 6, 14, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 22,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 16,
  },
  kindRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kindTile: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  kindLabel: {
    fontFamily: F.semibold,
    fontSize: 12.5,
  },
  noteInput: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: F.regular,
    textAlign: 'left',
  },
  sheetSend: {
    borderRadius: 18,
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheetSendText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
