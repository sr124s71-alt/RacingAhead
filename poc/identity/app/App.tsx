import { StatusBar } from 'expo-status-bar';
import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, APP_VERSION, Config, isBelow, makeApi, MOCK, Tokens, Variant } from './src/api';
import { Admin } from './src/screens/Admin';
import { Phase1Login, UpdateRequired } from './src/screens/Phase1';
import { Profile } from './src/screens/Profile';
import { SignIn } from './src/screens/SignIn';
import { C, THEMES } from './src/theme';
import { Button, Card, Notice, s } from './src/ui';

type Route = Variant | 'launcher' | 'stage';

/** On web the app variant comes from ?app=user|partner|admin|stage, so each browser tab or frame is its own app. */
function initialRoute(): Route {
  if (MOCK) return 'stage';
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'launcher';
  const app = new URLSearchParams(window.location.search).get('app');
  return app === 'user' || app === 'partner' || app === 'admin' || app === 'stage' ? app : 'launcher';
}

export default function App() {
  const [route, setRoute] = useState<Route>(initialRoute);
  return (
    <SafeAreaProvider>
      {route === 'stage' ? (
        <DemoStage />
      ) : route === 'launcher' ? (
        <Launcher onPick={setRoute} />
      ) : (
        <AppShell key={route} variant={route} onExit={Platform.OS === 'web' ? undefined : () => setRoute('launcher')} />
      )}
    </SafeAreaProvider>
  );
}

function AppShell({ variant, onExit }: { variant: Variant; onExit?: () => void }) {
  const theme = THEMES[variant];
  const api = useMemo(() => makeApi(variant), [variant]);
  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(() => loadSession(variant));

  // Polls config so the remote switch and minimum version take effect live during the demo.
  useEffect(() => {
    const load = () =>
      api.config().then(
        (c) => {
          setConfig(c);
          setConfigError(null);
        },
        (e) => setConfigError(e.message),
      );
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [api]);

  const signIn = useCallback(
    (t: Tokens | null) => {
      setTokens(t);
      saveSession(variant, t);
    },
    [variant],
  );
  const signOut = useCallback(() => signIn(null), [signIn]);

  const wide = variant === 'admin';
  let body;
  if (!config) {
    body = (
      <Card>{configError ? <Notice tone="danger">{configError}</Notice> : <Text style={s.muted}>Connecting to {API_URL}…</Text>}</Card>
    );
  } else if (variant !== 'admin' && isBelow(APP_VERSION, config.minAppVersion)) {
    body = <UpdateRequired theme={theme} min={config.minAppVersion} current={APP_VERSION} />;
  } else if (variant !== 'admin' && !config.sharedIdentityEnabled) {
    body = <Phase1Login api={api} variant={variant} theme={theme} />;
  } else if (!tokens) {
    body = <SignIn api={api} variant={variant} theme={theme} devInbox={config.devOtpInbox} onSignedIn={signIn} />;
  } else if (variant === 'admin') {
    body = <Admin api={api} tokens={tokens} onSignOut={signOut} />;
  } else {
    body = <Profile api={api} variant={variant} theme={theme} tokens={tokens} onTokens={signIn} onSignOut={signOut} />;
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.primary }}>
      <StatusBar style="light" />
      <View style={[st.header, { backgroundColor: theme.primary }]}>
        <View style={[st.inner, wide && st.innerWide, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View>
            <Text style={st.brand}>{theme.name}</Text>
            <Text style={st.tagline}>{theme.tagline}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {onExit && (
              <Pressable onPress={onExit}>
                <Text style={st.exit}>Switch app</Text>
              </Pressable>
            )}
            <Text style={st.version}>v{APP_VERSION}</Text>
          </View>
        </View>
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ paddingVertical: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[st.inner, wide && st.innerWide]}>{body}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Launcher({ onPick }: { onPick: (r: Route) => void }) {
  const web = Platform.OS === 'web';
  const go = (r: Route) => (web ? window.location.assign(`?app=${r}`) : onPick(r));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={st.inner}>
          <Text style={[s.h1, { marginTop: 24 }]}>SportSeek Shared Identity</Text>
          <Text style={[s.muted, { marginBottom: 20 }]}>F3 proof of concept · Phase 2A · API {API_URL}</Text>
          {web && (
            <Card>
              <Text style={[s.body, { marginBottom: 12 }]}>User App, Partner App and Admin Portal side by side, for the live demo.</Text>
              <Button label="Open demo stage" theme={THEMES.admin} onPress={() => go('stage')} />
            </Card>
          )}
          {(['user', 'partner', 'admin'] as Variant[]).map((v) => (
            <Pressable key={v} onPress={() => go(v)} style={[s.card, { borderLeftWidth: 6, borderLeftColor: THEMES[v].primary }]}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: THEMES[v].primaryDark }}>
                {v === 'user' ? 'User App' : v === 'partner' ? 'Partner App' : 'Admin Portal'}
              </Text>
              <Text style={s.muted}>{THEMES[v].tagline}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Web only: the three apps in separate frames, so each keeps its own session exactly like separate apps on separate phones. */
function DemoStage() {
  return MOCK ? <PrototypeStage /> : <FramedStage />;
}

const GUIDE = [
  ['User App', 'Register with any Indian mobile, e.g. 98111 22233. Codes arrive in the Dev SMS inbox: tap to use.'],
  ['Partner App', 'Use the same number. The account is found, and a role is only added after you prove ownership by OTP.'],
  ['Admin Portal', 'Sign in with the pre-filled number: one identity with both roles, the audit log, Phase 1 bootstrap, remote switch.'],
] as const;

/**
 * Shareable prototype: the three apps side by side in one page (no iframes), sharing the in-browser API.
 * Below 1100px wide it becomes tabs, so it works on a phone.
 */
function PrototypeStage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1100;
  const [tab, setTab] = useState<Variant>('user');
  const apps: [Variant, string, number][] = [
    ['user', 'User App', 1],
    ['partner', 'Partner App', 1],
    ['admin', 'Admin Portal', 1.55],
  ];
  return (
    <View style={[pst.stage, { padding: wide ? 16 : 10 }]}>
      <View style={pst.top}>
        <View style={{ flexShrink: 1, minWidth: 260 }}>
          <Text style={pst.title}>SportSeek Shared Identity</Text>
          <Text style={pst.sub}>F3 prototype · one person, one identity, across apps</Text>
        </View>
        {wide && (
          <View style={pst.guide}>
            {GUIDE.map(([app, text], i) => (
              <View key={app} style={pst.step}>
                <Text style={pst.stepNo}>{i + 1}</Text>
                <Text style={pst.stepText}>
                  <Text style={{ fontWeight: '800', color: '#F1F5F9' }}>{app}. </Text>
                  {text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {!wide && (
        <View style={pst.tabs}>
          {apps.map(([v, name]) => (
            <Pressable
              key={v}
              accessibilityRole="tab"
              onPress={() => setTab(v)}
              style={[pst.tab, tab === v && { backgroundColor: THEMES[v].primary }]}
            >
              <Text style={[pst.tabText, tab === v && { color: '#fff' }]}>{name}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ flex: 1, flexDirection: 'row', gap: 14, minHeight: 0 }}>
        {apps.map(([v, , flex]) => (
          <View key={v} style={[pst.device, { flex }, !wide && tab !== v && { display: 'none' }]}>
            <AppShell variant={v} />
          </View>
        ))}
      </View>
      <Text style={pst.foot}>
        Prototype: the Identity API runs in your browser and your test data stays on this device. OTPs are shown in each app's Dev SMS inbox
        instead of being texted. Start over from Admin Portal → Remote switch → Reset demo data.
      </Text>
    </View>
  );
}

const pst = StyleSheet.create({
  stage: { flex: 1, backgroundColor: '#0F172A', gap: 12, height: '100%' },
  top: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#F8FAFC', fontSize: 19, fontWeight: '800' },
  sub: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  guide: { flexDirection: 'row', gap: 14, flex: 1, maxWidth: 980 },
  step: { flexDirection: 'row', gap: 8, flex: 1, alignItems: 'flex-start' },
  stepNo: {
    color: '#0F172A',
    backgroundColor: '#CBD5E1',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: { color: '#CBD5E1', fontSize: 12, lineHeight: 17, flex: 1 },
  tabs: { flexDirection: 'row', gap: 6, backgroundColor: '#1E293B', padding: 4, borderRadius: 12 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabText: { color: '#CBD5E1', fontWeight: '700', fontSize: 13 },
  device: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff', minWidth: 0 },
  foot: { color: '#94A3B8', fontSize: 12, lineHeight: 17 },
});

function FramedStage() {
  const frame = (app: Variant, flex: number) =>
    createElement('iframe', {
      src: `?app=${app}`,
      title: app,
      style: { flex, border: 'none', borderRadius: 18, background: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,.18)', minWidth: 0 },
    });
  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 14, gap: 10, minHeight: '100%' as unknown as number }}>
      <Text style={{ color: '#E2E8F0', fontSize: 16, fontWeight: '800' }}>
        SportSeek Shared Identity · live demo{' '}
        <Text style={{ color: '#94A3B8', fontWeight: '400' }}>(one person, one identity, across apps)</Text>
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', gap: 14 }}>
        {frame('user', 1)}
        {frame('partner', 1)}
        {frame('admin', 1.6)}
      </View>
    </View>
  );
}

// Per-app session on web (sessionStorage is per tab/frame); memory only on native, fine for a POC.
function loadSession(v: Variant): Tokens | null {
  try {
    const raw = Platform.OS === 'web' ? window.sessionStorage.getItem('tokens:' + v) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(v: Variant, t: Tokens | null) {
  try {
    if (Platform.OS !== 'web') return;
    if (t) window.sessionStorage.setItem('tokens:' + v, JSON.stringify(t));
    else window.sessionStorage.removeItem('tokens:' + v);
  } catch {
    // storage unavailable: session stays in memory
  }
}

const st = StyleSheet.create({
  header: { paddingTop: 14, paddingBottom: 16 },
  inner: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 16 },
  innerWide: { maxWidth: 1100 },
  brand: { color: '#fff', fontSize: 20, fontWeight: '800' },
  tagline: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  exit: { color: '#fff', fontWeight: '700', fontSize: 13 },
  version: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
});
