import { useState } from 'react';
import { Text, View } from 'react-native';
import { Api, ApiError, Phase1Account, Variant } from '../api';
import { Theme } from '../theme';
import { Button, Card, Field, KeyValue, Notice, s } from '../ui';

/** The Phase 1 login the apps fall back to while F3 is switched off (plan task 2.10). */
export function Phase1Login({ api, variant, theme }: { api: Api; variant: Variant; theme: Theme }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [account, setAccount] = useState<Phase1Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      setAccount(await api.phase1Login(identifier, password));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Notice tone="warn" title="Shared Identity is switched off">
        This app is using the Phase 1 login. Accounts are separate per app. Nothing created with Shared Identity has been lost: switch it
        back on and everyone signs in as before.
      </Notice>
      {account ? (
        <Card title={`Phase 1 ${variant === 'partner' ? 'partner' : 'user'} account`}>
          <Text style={s.h1}>{account.businessName ?? account.name}</Text>
          <KeyValue k="Phase 1 account #" v={String(account.legacyId)} />
          {account.businessName && <KeyValue k="Owner" v={account.name} />}
          {account.partnerType && <KeyValue k="Partner type" v={account.partnerType} />}
          {account.kycStatus && <KeyValue k="KYC" v={account.kycStatus} />}
          <View style={{ marginTop: 12 }}>
            <Button label="Sign out" kind="ghost" theme={theme} onPress={() => setAccount(null)} />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={s.h1}>Sign in</Text>
          <Text style={[s.muted, { marginBottom: 16 }]}>Phase 1 demo accounts use the password demo1234.</Text>
          <Field
            label="Mobile number or email"
            placeholder={variant === 'partner' ? '98765 43210' : '98123 45678'}
            value={identifier}
            onChangeText={setIdentifier}
          />
          <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={signIn} />
          {error && <Notice tone="danger">{error}</Notice>}
          <Button label="Sign in" theme={theme} busy={busy} onPress={signIn} disabled={!identifier || !password} />
        </Card>
      )}
    </View>
  );
}

export function UpdateRequired({ theme, min, current }: { theme: Theme; min: string; current: string }) {
  return (
    <Card>
      <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 8 }}>⬆️</Text>
      <Text style={[s.h1, { textAlign: 'center' }]}>Update required</Text>
      <Text style={[s.body, { textAlign: 'center', marginVertical: 12 }]}>
        This version ({current}) is no longer supported. Please update to {min} or later to keep using {theme.name}.
      </Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>
        Minimum-version enforcement: the API also answers 426 to this build, so old apps in the field cannot call changed APIs.
      </Text>
    </Card>
  );
}
