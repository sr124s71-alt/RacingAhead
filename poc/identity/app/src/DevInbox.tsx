import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Api, OtpMessage } from './api';
import { C, Theme } from './theme';

/**
 * POC stand-in for the phone's SMS app: shows the OTPs the API "sent" (Development only).
 * Tap the message for the current challenge to fill the code in.
 */
export function DevInbox({
  api,
  theme,
  challengeId,
  onUse,
}: {
  api: Api;
  theme: Theme;
  challengeId?: string;
  onUse?: (code: string) => void;
}) {
  const [messages, setMessages] = useState<OtpMessage[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .otpInbox()
        .then((m) => alive && setMessages(m.filter((x) => x.client === api.clientId).slice(0, 3)))
        .catch(() => undefined);
    load();
    const t = setInterval(load, 1500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [api, challengeId]); // reload at once when a new code is requested

  return (
    <View style={st.wrap}>
      <Pressable onPress={() => setOpen(!open)} style={st.head}>
        <Text style={st.headText}>📱 Dev SMS inbox {messages.length ? `(${messages.length})` : ''}</Text>
        <Text style={st.headText}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open &&
        (messages.length === 0 ? (
          <Text style={st.empty}>No codes yet. Codes appear here instead of being sent by SMS.</Text>
        ) : (
          messages.map((m) => {
            const current = !!challengeId && m.challengeId === challengeId;
            return (
              <Pressable
                key={m.challengeId}
                disabled={!current || !onUse}
                onPress={() => onUse?.(m.code)}
                style={[st.msg, current && { borderColor: theme.primary }]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={st.to}>To {m.to}</Text>
                  <Text style={st.time}>{new Date(m.at).toLocaleTimeString()}</Text>
                </View>
                <Text style={st.text}>
                  <Text style={[st.code, { color: theme.primaryDark }]}>{m.code}</Text> {m.text.slice(m.code.length + 1)}
                </Text>
                {onUse && current ? <Text style={[st.use, { color: theme.primary }]}>Tap to use this code</Text> : null}
              </Pressable>
            );
          })
        ))}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { backgroundColor: '#1F2937', borderRadius: 14, padding: 10, marginBottom: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 2 },
  headText: { color: '#E5E7EB', fontWeight: '700', fontSize: 13 },
  empty: { color: '#9CA3AF', fontSize: 12, padding: 6 },
  msg: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 2, borderColor: 'transparent' },
  to: { fontSize: 11, color: C.muted, fontWeight: '600' },
  time: { fontSize: 11, color: C.muted },
  text: { fontSize: 13, color: C.text, marginTop: 3, lineHeight: 18 },
  code: { fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  use: { fontSize: 11, fontWeight: '700', marginTop: 4 },
});
