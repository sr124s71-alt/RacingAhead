import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Api, ApiError, decodeJwt, Profile as ProfileT, Tokens, Variant } from '../api';
import { APP_COLOURS, APP_LABELS, C, ROLE_LABELS, Theme } from '../theme';
import { Badge, Button, Card, Chip, Field, KeyValue, Notice, Row, s } from '../ui';

const OUTCOME: Record<string, { tone: 'ok' | 'info' | 'warn'; title: string; text: (role: string) => string }> = {
  Created: {
    tone: 'ok',
    title: 'Welcome to SportSeek',
    text: (r) => `Your account was created with the ${r} role.`,
  },
  Linked: {
    tone: 'warn',
    title: 'Linked to your existing SportSeek account',
    text: (r) => `We found your account and added ${r} to it. No new account was created: your profile and KYC are shared.`,
  },
  ClaimedLegacy: {
    tone: 'info',
    title: 'Your existing account is connected',
    text: () => 'You proved you own this number, so your Phase 1 account now signs in with Shared Identity.',
  },
};

const KYC_TONE = { NotStarted: 'muted', Submitted: 'warn', Verified: 'ok', Rejected: 'danger' } as const;

export function Profile({
  api,
  variant,
  theme,
  tokens,
  onTokens,
  onSignOut,
}: {
  api: Api;
  variant: Variant;
  theme: Theme;
  tokens: Tokens;
  onTokens: (t: Tokens) => void;
  onSignOut: () => void;
}) {
  const [me, setMe] = useState<ProfileT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [docType, setDocType] = useState('PAN');
  const [docNumber, setDocNumber] = useState('');
  const [pw, setPw] = useState('');
  const [pwDone, setPwDone] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const claims = decodeJwt(tokens.access_token);
  const outcome = OUTCOME[String(claims.link_outcome)];
  const roleAdded = claims.role_added ? ROLE_LABELS[String(claims.role_added)] : '';

  const load = useCallback(
    () =>
      api.me(tokens.access_token).then(setMe, (e) =>
        // 401: the token is no longer valid (e.g. the POC API restarted with new keys), so sign in again.
        e instanceof ApiError && e.status === 401 ? onSignOut() : setError(e.message),
      ),
    [api, tokens.access_token, onSignOut],
  );

  useEffect(() => {
    load();
    const t = setInterval(load, 3000); // picks up KYC verification by the admin live
    return () => clearInterval(t);
  }, [load]);

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  if (!me) return <Card>{error ? <Notice tone="danger">{error}</Notice> : <Text style={s.muted}>Loading your profile…</Text>}</Card>;

  const thisAppRoles = me.roles.filter((r) => r.inThisApp);
  const otherRoles = me.roles.filter((r) => !r.inThisApp);

  return (
    <View>
      {outcome && (
        <Notice tone={outcome.tone} title={outcome.title}>
          {outcome.text(roleAdded || ROLE_LABELS[thisAppRoles[0]?.role] || '')}
        </Notice>
      )}
      {error && <Notice tone="danger">{error}</Notice>}

      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={s.h1}>Hi, {me.displayName.split(' ')[0]}</Text>
            <Text style={s.muted}>Signed in to the {APP_LABELS[api.clientId]}</Text>
          </View>
          <View
            style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 22, fontWeight: '800', color: theme.primaryDark }}>{me.displayName.slice(0, 1)}</Text>
          </View>
        </Row>
      </Card>

      <Card title="Your roles">
        <Row wrap style={{ marginBottom: otherRoles.length ? 12 : 0 }}>
          {thisAppRoles.map((r) => (
            <Chip key={r.role} label={ROLE_LABELS[r.role]} colour={theme.primary} />
          ))}
        </Row>
        {otherRoles.length > 0 && (
          <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 }}>
            <Text style={[s.muted, { marginBottom: 8 }]}>Also on your SportSeek account (use them in the other app):</Text>
            <Row wrap>
              {otherRoles.map((r) => (
                <Chip
                  key={r.role}
                  label={`${ROLE_LABELS[r.role]} · ${APP_LABELS[r.app ?? ''] ?? ''}`}
                  colour={APP_COLOURS[r.app ?? ''] ?? C.muted}
                />
              ))}
            </Row>
          </View>
        )}
      </Card>

      <Card title="SportSeek identity" right={<Badge label="Shared across apps" tone="info" />}>
        <KeyValue k="Identity ID" v={me.identityId.slice(0, 8) + '…' + me.identityId.slice(-4)} mono />
        {me.contacts.map((c) => (
          <KeyValue
            key={c.value}
            k={c.type === 'phone' ? 'Mobile' : 'Email'}
            v={
              <Row gap={6}>
                <Text style={s.kvVal}>{c.value}</Text>
                <Badge label={c.verified ? 'Verified' : 'Unverified'} tone={c.verified ? 'ok' : 'muted'} />
              </Row>
            }
          />
        ))}
        <KeyValue k="Member since" v={new Date(me.createdAt).toLocaleDateString()} />
        <KeyValue k="Created from" v={APP_LABELS[me.createdVia] ?? me.createdVia} />
      </Card>

      <Card
        title="KYC verification"
        right={<Badge label={me.kyc.status.replace('NotStarted', 'Not started')} tone={KYC_TONE[me.kyc.status]} />}
      >
        <Text style={[s.muted, { marginBottom: 12 }]}>Verify once, and it's reused by every role and app on your account.</Text>
        {me.kyc.status === 'NotStarted' || me.kyc.status === 'Rejected' ? (
          <>
            <Row wrap style={{ marginBottom: 12 }}>
              {['PAN', 'Aadhaar', 'GSTIN'].map((d) => (
                <Chip key={d} label={d} colour={theme.primary} active={docType === d} onPress={() => setDocType(d)} />
              ))}
            </Row>
            <Field
              label={`${docType} number`}
              placeholder={docType === 'PAN' ? 'ABCDE1234F' : ''}
              value={docNumber}
              onChangeText={setDocNumber}
              autoCapitalize="characters"
            />
            <Button
              label="Submit for verification"
              theme={theme}
              busy={busy === 'kyc'}
              disabled={docNumber.trim().length < 6}
              onPress={() => act('kyc', async () => setMe(await api.submitKyc(tokens.access_token, docType, docNumber)))}
            />
          </>
        ) : (
          <>
            <KeyValue k="Document" v={`${me.kyc.docType ?? ''} ${me.kyc.docRefMasked ?? ''}`.trim()} />
            <KeyValue k="Submitted via" v={APP_LABELS[me.kyc.submittedVia ?? ''] ?? me.kyc.submittedVia ?? '—'} />
            {me.kyc.verifiedAt && <KeyValue k="Verified" v={new Date(me.kyc.verifiedAt).toLocaleString()} />}
          </>
        )}
      </Card>

      <Card title="Password" right={<Badge label={me.hasPassword ? 'Set' : 'Not set'} tone={me.hasPassword ? 'ok' : 'muted'} />}>
        <Text style={[s.muted, { marginBottom: 12 }]}>
          One password for your SportSeek account. Changing it here changes it in every app.
        </Text>
        {pwDone && <Notice tone="ok">Password saved. Try it in the other app's Password tab.</Notice>}
        <Field
          label={me.hasPassword ? 'New password' : 'Choose a password'}
          secureTextEntry
          value={pw}
          onChangeText={setPw}
          hint="At least 8 characters with a number"
        />
        <Button
          label="Save password"
          kind="secondary"
          theme={theme}
          busy={busy === 'pw'}
          disabled={pw.length < 8}
          onPress={() =>
            act('pw', async () => {
              setMe(await api.setPassword(tokens.access_token, pw));
              setPw('');
              setPwDone(true);
            })
          }
        />
      </Card>

      <Card
        title="What this app's token carries"
        right={
          <Pressable onPress={() => setShowToken(!showToken)}>
            <Text style={{ color: theme.primary, fontWeight: '700' }}>{showToken ? 'Hide' : 'Show'}</Text>
          </Pressable>
        }
      >
        <Text style={s.muted}>Tokens are app-scoped: this app's token only carries this app's roles.</Text>
        {showToken && (
          <View style={{ marginTop: 10 }}>
            {['sub', 'name', 'app', 'role', 'link_outcome', 'role_added', 'scope', 'exp'].map((k) =>
              claims[k] === undefined ? null : (
                <KeyValue
                  key={k}
                  k={k}
                  mono
                  v={
                    k === 'exp'
                      ? new Date(Number(claims[k]) * 1000).toLocaleTimeString()
                      : Array.isArray(claims[k])
                        ? (claims[k] as string[]).join(', ')
                        : String(claims[k])
                  }
                />
              ),
            )}
            <Button
              small
              kind="ghost"
              theme={theme}
              label="Refresh token now"
              busy={busy === 'refresh'}
              onPress={() => act('refresh', async () => onTokens(await api.refresh(tokens.refresh_token!)))}
            />
          </View>
        )}
      </Card>

      <Button label="Sign out" kind="ghost" theme={theme} onPress={onSignOut} />
      <Text style={[s.muted, { textAlign: 'center', marginTop: 10 }]}>
        {variant === 'partner' ? 'Partner App' : 'User App'} · Shared Identity (F3)
      </Text>
    </View>
  );
}
