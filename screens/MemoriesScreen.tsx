import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore, useTheme } from '../lib/store';
import type { Memory } from '../lib/store';
import { F } from '../lib/theme';
import { clockTime, dayLabel, streakOf, timeAgo } from '../lib/format';
import { Card, IconCircle, StatBox } from '../components/UI';
import FloatingHearts from '../components/FloatingHearts';

type Row =
  | { type: 'header'; key: string; label: string; count: number }
  | { type: 'item'; key: string; memory: Memory };

const KIND_ICON: Record<Memory['kind'], keyof typeof Ionicons.glyphMap> = {
  heart: 'heart',
  hug: 'body',
  kiss: 'sparkles',
};

const VERB: Record<Memory['kind'], string> = {
  heart: 'ഹൃദയം അയച്ചു',
  hug: 'ആലിംഗനം അയച്ചു',
  kiss: 'ചുംബനം അയച്ചു',
};

export default function MemoriesScreen() {
  const { colors, dark } = useTheme();
  const { memories, refreshNow, deleteMemory, partnerName } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Memory | null>(null);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastLabel: string | null = null;
    for (const m of memories) {
      const label = dayLabel(m.t);
      if (label !== lastLabel) {
        const count = memories.filter((x) => dayLabel(x.t) === label).length;
        out.push({ type: 'header', key: `h-${label}`, label, count });
        lastLabel = label;
      }
      out.push({ type: 'item', key: m.id, memory: m });
    }
    return out;
  }, [memories]);

  const sent = memories.filter((m) => m.dir === 'sent').length;
  const recv = memories.length - sent;
  const streak = streakOf(memories.map((m) => m.t));

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNow();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FloatingHearts color={dark ? '#FF6B94' : '#FFB3C6'} opacity={dark ? 0.1 : 0.18} count={5} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>ഓർമ്മകൾ</Text>
          <Text style={[styles.subtitle, { color: colors.sub }]}>
            നിങ്ങളുടെ സ്പർശനങ്ങളുടെ കാലക്രമം
          </Text>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <Card colors={colors} style={{ marginBottom: 18 }}>
              <View style={styles.statsRow}>
                <StatBox colors={colors} value={String(sent)} label="അയച്ചത്" icon="arrow-up" />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <StatBox colors={colors} value={String(recv)} label="ലഭിച്ചത്" icon="arrow-down" />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <StatBox colors={colors} value={`${streak}`} label="തുടർച്ച (ദിവസം)" icon="flame" />
              </View>
            </Card>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyCircle, { backgroundColor: `${colors.primary}14` }]}>
                <Ionicons name="heart-outline" size={46} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>ഇതുവരെ ഓർമ്മകളില്ല</Text>
              <Text style={[styles.emptySub, { color: colors.sub }]}>
                ഹൃദയം തൊട്ട് ആദ്യത്തെ സ്പർശനം അയയ്ക്കൂ — അത് ഇവിടെ സൂക്ഷിക്കപ്പെടും.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: colors.primary }]}>{item.label}</Text>
                  <Text style={[styles.sectionCount, { color: colors.faint }]}>
                    {item.count} സ്പർശനം
                  </Text>
                </View>
              );
            }
            const m = item.memory;
            const mine = m.dir === 'sent';
            const who = mine ? 'നിങ്ങൾ' : m.from || partnerName || 'പ്രിയപ്പെട്ടയാൾ';
            return (
              <Pressable
                onPress={() => setSelected(m)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed ? colors.cardAlt : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <IconCircle
                  name={KIND_ICON[m.kind]}
                  colors={colors}
                  bg={mine ? `${colors.primary}1A` : `${colors.success}1A`}
                  fg={mine ? colors.primary : colors.success}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>
                    {who} · {VERB[m.kind]}
                  </Text>
                  {m.note ? (
                    <Text style={[styles.rowNote, { color: colors.sub }]} numberOfLines={2}>
                      “{m.note}”
                    </Text>
                  ) : null}
                  <Text style={[styles.rowTime, { color: colors.faint }]}>
                    {timeAgo(m.t)} · {clockTime(m.t)}
                  </Text>
                </View>
                {m.pending ? (
                  <Ionicons name="cloud-offline-outline" size={16} color={colors.danger} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={colors.faint} />
                )}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={[styles.detail, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {selected ? (
              <>
                <IconCircle
                  name={KIND_ICON[selected.kind]}
                  colors={colors}
                  bg={`${colors.primary}1A`}
                  fg={colors.primary}
                  size={68}
                />
                <Text style={[styles.detailTitle, { color: colors.text }]}>
                  {selected.dir === 'sent' ? 'നിങ്ങൾ അയച്ചു' : `${selected.from} അയച്ചു`}
                </Text>
                <Text style={[styles.detailKind, { color: colors.primary }]}>
                  {VERB[selected.kind]}
                </Text>
                {selected.note ? (
                  <View style={[styles.detailNoteBox, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                    <Text style={[styles.detailNote, { color: colors.text }]}>“{selected.note}”</Text>
                  </View>
                ) : null}
                <Text style={[styles.detailTime, { color: colors.sub }]}>
                  {dayLabel(selected.t)} · {clockTime(selected.t)}
                </Text>
                <View style={styles.detailRow}>
                  <Pressable
                    onPress={() => {
                      setSelected(null);
                    }}
                    style={({ pressed }) => [
                      styles.detailBtn,
                      { backgroundColor: colors.cardAlt, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[styles.detailBtnText, { color: colors.text }]}>അടയ്ക്കുക</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (selected) deleteMemory(selected.id);
                      setSelected(null);
                    }}
                    style={({ pressed }) => [
                      styles.detailBtn,
                      { backgroundColor: colors.danger, borderColor: colors.danger, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text style={[styles.detailBtnText, { color: '#FFFFFF' }]}>ഇല്ലാതാക്കുക</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 6,
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
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 9,
  },
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 14.5,
    textAlign: 'left',
  },
  sectionCount: {
    fontFamily: F.regular,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  rowTitle: {
    fontFamily: F.semibold,
    fontSize: 14.5,
    textAlign: 'left',
  },
  rowNote: {
    fontFamily: F.regular,
    fontSize: 13,
    textAlign: 'left',
    marginTop: 2,
  },
  rowTime: {
    fontFamily: F.regular,
    fontSize: 11.5,
    textAlign: 'left',
    marginTop: 3,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 6, 14, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  detail: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1,
    padding: 26,
    alignItems: 'center',
  },
  detailTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    marginTop: 14,
  },
  detailKind: {
    fontFamily: F.semibold,
    fontSize: 14.5,
    marginTop: 4,
  },
  detailNoteBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    width: '100%',
  },
  detailNote: {
    fontFamily: F.regular,
    fontSize: 15,
    textAlign: 'center',
  },
  detailTime: {
    fontFamily: F.regular,
    fontSize: 13,
    marginTop: 14,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 20,
  },
  detailBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  detailBtnText: {
    fontFamily: F.semibold,
    fontSize: 14.5,
  },
});
