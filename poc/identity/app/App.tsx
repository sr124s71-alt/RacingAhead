import { StatusBar } from 'expo-status-bar';
import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, APP_VERSION, Config, isBelow, makeApi, Tokens, Variant } from './src/api';
import { Admin } from './src/screens/Admin';
import { Phase1Login, UpdateRequired } from './src/screens/Phase1';
import { Profile } from './src/screens/Profile';
import { SignIn } from './src/screens/SignIn';
import { C, THEMES } from './src/theme';
import { Button, Card, Notice, s } from './src/ui';

type Route = Variant | 'launcher' | 'stage';

/** On web the app variant comes from ?app=user|partner|admin|stage, so each browser tab or frame is its own app. */
function initialRoute(): Route {
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
