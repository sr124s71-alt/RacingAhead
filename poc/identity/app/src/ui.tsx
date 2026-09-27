import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { C, Theme } from './theme';

export function Card({ title, right, children, style }: { title?: string; right?: ReactNode; children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[s.card, style]}>
      {(title || right) && (
        <View style={s.cardHead}>
          {title ? <Text style={s.cardTitle}>{title}</Text> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  theme,
  kind = 'primary',
  busy,
  disabled,
  small,
}: {
  label: string;
  onPress: () => void;
  theme: Theme;
  kind?: 'primary' | 'secondary' | 'danger' | 'ghost';
  busy?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  const bg = kind === 'primary' ? theme.primary : kind === 'danger' ? C.danger : kind === 'secondary' ? theme.tint : 'transparent';
  const fg = kind === 'primary' || kind === 'danger' ? theme.onPrimary : theme.primaryDark;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.button,
        small && s.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        kind === 'ghost' && { borderWidth: 1, borderColor: C.border },
      ]}
    >
      {busy ? <ActivityIndicator color={fg} /> : <Text style={[s.buttonText, small && s.buttonTextSmall, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#9CA3AF" style={s.input} autoCapitalize="none" autoCorrect={false} {...props} />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({ label, colour, active = true, onPress }: { label: string; colour: string; active?: boolean; onPress?: () => void }) {
  const body = (
    <View style={[s.chip, active ? { backgroundColor: colour, borderColor: colour } : { borderColor: C.border, backgroundColor: C.card }]}>
      <Text style={[s.chipText, { color: active ? '#fff' : C.text }]}>{label}</Text>
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function Badge({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'danger' | 'info' | 'muted' }) {
  const map = {
    ok: [C.okBg, C.ok],
    warn: [C.warnBg, C.warn],
    danger: [C.dangerBg, C.danger],
    info: [C.infoBg, C.info],
    muted: ['#F3F4F6', C.muted],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Notice({ tone, title, children }: { tone: 'ok' | 'warn' | 'danger' | 'info'; title?: string; children: ReactNode }) {
  const map = { ok: [C.okBg, C.ok], warn: [C.warnBg, C.warn], danger: [C.dangerBg, C.danger], info: [C.infoBg, C.info] } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[s.notice, { backgroundColor: bg, borderLeftColor: fg }]}>
      {title ? <Text style={[s.noticeTitle, { color: fg }]}>{title}</Text> : null}
      <Text style={[s.noticeText, { color: C.text }]}>{children}</Text>
    </View>
  );
}

export function Row({ children, gap = 8, wrap, style }: { children: ReactNode; gap?: number; wrap?: boolean; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

export function KeyValue({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <View style={s.kv}>
      <Text style={s.kvKey}>{k}</Text>
      {typeof v === 'string' ? <Text style={[s.kvVal, mono && s.mono]}>{v}</Text> : v}
    </View>
  );
}

export const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  button: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  buttonSmall: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  buttonTextSmall: { fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  hint: { fontSize: 12, color: C.muted, marginTop: 5 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: C.text,
    backgroundColor: '#FAFAFB',
  },
  chip: { borderRadius: 999, borderWidth: 1, paddingVertical: 5, paddingHorizontal: 11 },
  chipText: { fontSize: 13, fontWeight: '600' },
  badge: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  notice: { borderRadius: 10, padding: 12, borderLeftWidth: 4, marginBottom: 14 },
  noticeTitle: { fontWeight: '700', marginBottom: 3, fontSize: 14 },
  noticeText: { fontSize: 14, lineHeight: 20 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, gap: 12 },
  kvKey: { color: C.muted, fontSize: 14 },
  kvVal: { color: C.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  mono: { fontFamily: 'monospace', fontSize: 12 },
  muted: { color: C.muted, fontSize: 13, lineHeight: 18 },
  h1: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 4 },
  body: { fontSize: 15, color: C.text, lineHeight: 21 },
});
