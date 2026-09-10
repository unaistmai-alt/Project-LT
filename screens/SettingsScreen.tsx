import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore, useTheme } from '../lib/store';
import type { ThemePref } from '../lib/store';
import { F } from '../lib/theme';
import { Card, IconCircle, SectionTitle } from '../components/UI';
import ConfirmModal from '../components/ConfirmModal';
import FloatingHearts from '../components/FloatingHearts';
import { hapticTest } from '../lib/haptics';

const THEME_OPTIONS: { key: ThemePref; label: string }[] = [
  { key: 'system', label: 'സിസ്റ്റം' },
  { key: 'light', label: 'ലൈറ്റ്' },
  { key: 'dark', label: 'ഡാർക്ക്' },
];

export default function SettingsScreen() {
  const { colors, dark } = useTheme();
  const store = useStore();
  const [nameDraft, setNameDraft] = useState(store.name);
  const [partnerDraft, setPartnerDraft] = useState(store.partnerName);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FloatingHearts color={dark ? '#FF6B94' : '#FFB3C6'} opacity={dark ? 0.1 : 0.16} count={4} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>ക്രമീകരണങ്ങൾ</Text>

          <Card colors={colors} style={{ marginTop: 16 }}>
            <SectionTitle colors={colors}>പ്രൊഫൈൽ</SectionTitle>
            <Text style={[styles.label, { color: colors.sub }]}>നിങ്ങളുടെ പേര്</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onEndEditing={() => store.setName(nameDraft.trim() || 'പ്രിയപ്പെട്ടയാൾ')}
              onBlur={() => store.setName(nameDraft.trim() || 'പ്രിയപ്പെട്ടയാൾ')}
              placeholder="നിങ്ങളുടെ പേര്"
              placeholderTextColor={colors.faint}
              maxLength={20}
              style={[
                styles.input,
                { backgroundColor: colors.cardAlt, borderColor: colors.border, color: colors.text },
              ]}
              returnKeyType="done"
            />
            <Text style={[styles.label, { color: colors.sub, marginTop: 14 }]}>
              പങ്കാളിയുടെ പേര്
            </Text>
            <TextInput
              value={partnerDraft}
              onChangeText={setPartnerDraft}
              onEndEditing={() => store.setPartnerName(partnerDraft.trim())}
              onBlur={() => store.setPartnerName(partnerDraft.trim())}
              placeholder="പങ്കാളിയുടെ പേര്"
              placeholderTextColor={colors.faint}
              maxLength={20}
              style={[
                styles.input,
                { backgroundColor: colors.cardAlt, borderColor: colors.border, color: colors.text },
              ]}
              returnKeyType="done"
            />
          </Card>

          <Card colors={colors} style={{ marginTop: 16 }}>
            <SectionTitle colors={colors}>രൂപം</SectionTitle>
            <View style={styles.segment}>
              {THEME_OPTIONS.map((opt) => {
                const active = store.themePref === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => store.setThemePref(opt.key)}
                    style={({ pressed }) => [
                      styles.segmentItem,
                      {
                        backgroundColor: active ? colors.primary : colors.cardAlt,
                        borderColor: active ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? '#FFFFFF' : colors.sub },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card colors={colors} style={{ marginTop: 16 }}>
            <SectionTitle colors={colors}>ഫീഡ്‌ബാക്ക്</SectionTitle>
            <View style={styles.switchRow}>
              <IconCircle
                name="phone-portrait"
                colors={colors}
                bg={`${colors.primary}18`}
                fg={colors.primary}
                size={40}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>വൈബ്രേഷൻ</Text>
                <Text style={[styles.rowSub, { color: colors.sub }]}>
                  സിഗ്നൽ അയയ്ക്കുമ്പോഴും ലഭിക്കുമ്പോഴും ഫോൺ വിറയ്ക്കും
                </Text>
              </View>
              <Switch
                value={store.hapticsOn}
                onValueChange={store.setHapticsOn}
                trackColor={{ false: colors.border, true: `${colors.primary}88` }}
                thumbColor={store.hapticsOn ? colors.primary : colors.faint}
              />
            </View>
            <Pressable
              onPress={() => {
                if (store.hapticsOn) hapticTest();
              }}
              style={({ pressed }) => [
                styles.ghostBtn,
                { borderColor: colors.border, backgroundColor: colors.cardAlt, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="pulse" size={16} color={colors.primary} />
              <Text style={[styles.ghostText, { color: colors.primary }]}>
                വൈബ്രേഷൻ പരിശോധിക്കുക
              </Text>
            </Pressable>
          </Card>

          <Card colors={colors} style={{ marginTop: 16 }}>
            <SectionTitle colors={colors}>ഡാറ്റ</SectionTitle>
            <View style={styles.switchRow}>
              <IconCircle
                name="albums"
                colors={colors}
                bg={`${colors.primary}18`}
                fg={colors.primary}
                size={40}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {store.memories.length} ഓർമ്മകൾ സൂക്ഷിച്ചിരിക്കുന്നു
                </Text>
                <Text style={[styles.rowSub, { color: colors.sub }]}>
                  സന്ദേശങ്ങൾ 12 മണിക്കൂറിനു ശേഷം സേവറിൽ നിന്ന് സ്വയം മായും
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setConfirmClear(true)}
              style={({ pressed }) => [
                styles.ghostBtn,
                { borderColor: colors.border, backgroundColor: colors.cardAlt, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="trash" size={16} color={colors.danger} />
              <Text style={[styles.ghostText, { color: colors.danger }]}>എല്ലാ ഓർമ്മകളും മായ്ക്കുക</Text>
            </Pressable>
          </Card>

          <Card colors={colors} style={{ marginTop: 16 }}>
            <SectionTitle colors={colors}>അക്കൗണ്ട്</SectionTitle>
            <Pressable
              onPress={() => setConfirmLeave(true)}
              style={({ pressed }) => [
                styles.leaveBtn,
                { borderColor: colors.danger, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Ionicons name="exit" size={17} color={colors.danger} />
              <Text style={[styles.leaveText, { color: colors.danger }]}>
                റൂം വിട്ടുപോകുക
              </Text>
            </Pressable>
            <Text style={[styles.version, { color: colors.faint }]}>
              Lovetouch · വേർഷൻ 1.0 · സ്നേഹത്തോടെ നിർമ്മിച്ചത്
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>

      <ConfirmModal
        visible={confirmClear}
        colors={colors}
        icon="trash"
        title="ഓർമ്മകൾ മായ്ക്കണോ?"
        message="എല്ലാ സ്പർശനങ്ങളുടെയും കാലക്രമം ഇല്ലാതാകും. ഈ പ്രവൃത്തി മടക്കിയെടുക്കാനാവില്ല."
        confirmLabel="മായ്ക്കുക"
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          store.clearMemories();
          setConfirmClear(false);
        }}
      />

      <ConfirmModal
        visible={confirmLeave}
        colors={colors}
        icon="exit"
        title="റൂം വിടണോ?"
        message="നിങ്ങളുടെ ഓർമ്മകൾ മായും, പങ്കാളിയുമായുള്ള കണക്ഷൻ വിച്ഛേദിക്കപ്പെടും."
        confirmLabel="വിടുക"
        destructive
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          store.leaveRoom();
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
  label: {
    fontFamily: F.semibold,
    fontSize: 12.5,
    marginBottom: 8,
    marginTop: 4,
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
  segment: {
    flexDirection: 'row',
    gap: 9,
  },
  segmentItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  segmentText: {
    fontFamily: F.semibold,
    fontSize: 13.5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 14,
  },
  rowTitle: {
    fontFamily: F.semibold,
    fontSize: 15,
    textAlign: 'left',
    marginBottom: 2,
  },
  rowSub: {
    fontFamily: F.regular,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'left',
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
  },
  ghostText: {
    fontFamily: F.semibold,
    fontSize: 14,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 13,
  },
  leaveText: {
    fontFamily: F.semibold,
    fontSize: 15,
  },
  version: {
    fontFamily: F.regular,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 16,
  },
});
