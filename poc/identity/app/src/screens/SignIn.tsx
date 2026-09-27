import { useState } from 'react';
import { Text, View } from 'react-native';
import { Api, ApiError, OtpStart, Tokens, Variant } from '../api';
import { DevInbox } from '../DevInbox';
import { C, ROLE_LABELS, Theme } from '../theme';
import { Button, Card, Chip, Field, Notice, Row, s } from '../ui';

const ROLE_CHOICES: Record<Variant, string[]> = {
  user: ['Player', 'EventOrganiser'],
  partner: ['FacilityPartner', 'Coach', 'Physio', 'Nutritionist'],
  admin: [],
};

const SCENARIO_UI: Record<OtpStart['scenario'], { tone: 'ok' | 'info' | 'warn'; title: string }> = {
  register: { tone: 'ok', title: 'New account' },
  'sign-in': { tone: 'info', title: 'Welcome back' },
  link: { tone: 'warn', title: 'Existing SportSeek account found' },
};

export function SignIn({
  api,
  variant,
  theme,
  devInbox,
  onSignedIn,
}: {
  api: Api;
  variant: Variant;
  theme: Theme;
  devInbox: boolean;
  onSignedIn: (t: Tokens) => void;
}) {
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [identifier, setIdentifier] = useState(variant === 'admin' ? '+91 90000 00001' : '');
  const [role, setRole] = useState(ROLE_CHOICES[variant][0]);
  const [start, setStart] = useState<OtpStart | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const requestOtp = () => run(async () => setStart(await api.requestOtp(identifier, variant === 'admin' ? undefined : role)));
  const verify = () =>
    run(async () => {
      const t = await api.otpToken(start!.challengeId, code.trim(), variant === 'admin' ? undefined : role, name.trim() || undefined);
      onSignedIn(t);
    });
  const passwordSignIn = () => run(async () => onSignedIn(await api.passwordToken(identifier, password)));

  const reset = () => {
    setStart(null);
    setCode('');
    setError(null);
  };

  return (
    <View>
      <Card>
        <Text style={s.h1}>{variant === 'admin' ? 'Admin sign in' : start ? 'Enter your code' : 'Sign in or register'}</Text>
        <Text style={[s.muted, { marginBottom: 16 }]}>
          {variant === 'admin'
            ? 'Admin access is granted by SportSeek. It can never be self-registered.'
            : 'One SportSeek account works across the User and Partner apps.'}
        </Text>

        {variant !== 'admin' && !start && (
          <Row gap={0} style={{ marginBottom: 16, borderRadius: 10, backgroundColor: C.bg, padding: 3 }}>
            {(['otp', 'password'] as const).map((m) => (
              <Text
                key={m}
                onPress={() => {
                  setMode(m);
                  setError(null);
                }}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  paddingVertical: 8,
                  borderRadius: 8,
                  fontWeight: '700',
                  color: mode === m ? theme.primaryDark : C.muted,
                  backgroundColor: mode === m ? C.card : 'transparent',
                  overflow: 'hidden',
                }}
              >
                {m === 'otp' ? 'One-time code' : 'Password'}
              </Text>
            ))}
          </Row>
        )}

        {!start && (
          <>
            <Field
              label="Mobile number or email"
              placeholder="98765 43210"
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
              onSubmitEditing={mode === 'otp' ? requestOtp : undefined}
            />
            {mode === 'otp' && ROLE_CHOICES[variant].length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.label}>{variant === 'partner' ? 'I am a' : 'I want to'}</Text>
                <Row wrap>
                  {ROLE_CHOICES[variant].map((r) => (
                    <Chip
                      key={r}
                      label={variant === 'user' ? (r === 'Player' ? 'Play & book' : 'Organise events') : ROLE_LABELS[r]}
                      colour={theme.primary}
                      active={role === r}
                      onPress={() => setRole(r)}
                    />
                  ))}
                </Row>
              </View>
            )}
            {mode === 'password' && (
              <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={passwordSignIn} />
            )}
          </>
        )}

        {start && (
          <>
            <Notice tone={SCENARIO_UI[start.scenario].tone} title={SCENARIO_UI[start.scenario].title}>
              {start.message}
              {start.fromPhase1 ? '\nThis number is on an existing Phase 1 account; verifying it connects that account.' : ''}
            </Notice>
            {start.scenario === 'register' && (
              <Field label="Your name" placeholder="As you'd like it shown" value={name} onChangeText={setName} autoCapitalize="words" />
            )}
            <Field
              label="6-digit code"
              placeholder="••••••"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              onSubmitEditing={verify}
            />
          </>
        )}

        {error && <Notice tone="danger">{error}</Notice>}

        {!start && mode === 'otp' && (
          <Button label="Send code" onPress={requestOtp} theme={theme} busy={busy} disabled={!identifier.trim()} />
        )}
        {!start && mode === 'password' && (
          <Button label="Sign in" onPress={passwordSignIn} theme={theme} busy={busy} disabled={!identifier.trim() || !password} />
        )}
        {start && (
          <View style={{ gap: 8 }}>
            <Button
              label={
                start.scenario === 'link'
                  ? 'Verify & link account'
                  : start.scenario === 'register'
                    ? 'Verify & create account'
                    : 'Verify & sign in'
              }
              onPress={verify}
              theme={theme}
              busy={busy}
              disabled={code.trim().length !== 6}
            />
            <Button label="Use a different number" onPress={reset} theme={theme} kind="ghost" />
          </View>
        )}
      </Card>

      {devInbox && <DevInbox api={api} theme={theme} challengeId={start?.challengeId} onUse={start ? setCode : undefined} />}
    </View>
  );
}
