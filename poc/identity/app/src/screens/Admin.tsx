import { useCallback, useEffect, useState } from 'react';
import { Platform, Switch, Text, View } from 'react-native';
import { Api, ApiError, AuditRow, BootstrapReport, DuplicateGroup, Phase1Row, Profile, Tokens } from '../api';
import { APP_COLOURS, APP_LABELS, C, ROLE_LABELS, THEMES } from '../theme';
import { Badge, Button, Card, Chip, Field, Notice, Row, s } from '../ui';

const theme = THEMES.admin;
type Tab = 'identities' | 'audit' | 'phase1' | 'switches';

const ACTION_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info' | 'muted'> = {
  IDENTITY_CREATED: 'ok',
  ROLE_LINKED: 'warn',
  LEGACY_IDENTITY_CLAIMED: 'info',
  SIGNED_IN: 'muted',
  OTP_REQUESTED: 'muted',
  OTP_FAILED: 'danger',
  OTP_LOCKOUT: 'danger',
  PASSWORD_SIGN_IN_REFUSED: 'danger',
  KYC_SUBMITTED: 'warn',
  KYC_VERIFIED: 'ok',
  FLAG_CHANGED: 'info',
  BOOTSTRAP_RUN: 'info',
  PHASE1_LOGIN: 'muted',
};

const ROLE_APP: Record<string, string> = {
  Player: 'user-app',
  EventOrganiser: 'user-app',
  FacilityPartner: 'partner-app',
  Coach: 'partner-app',
  Physio: 'partner-app',
  Nutritionist: 'partner-app',
  Admin: 'admin-portal',
};

export function Admin({ api, tokens, onSignOut }: { api: Api; tokens: Tokens; onSignOut: () => void }) {
  const t = tokens.access_token;
  const [tab, setTab] = useState<Tab>('identities');
  const [identities, setIdentities] = useState<Profile[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [dupes, setDupes] = useState<DuplicateGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [i, a, d] = await Promise.all([api.admin.identities(t), api.admin.audit(t), api.admin.duplicates(t)]);
      setIdentities(i);
      setAudit(a);
      setDupes(d);
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) onSignOut();
      else setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api, t, onSignOut]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, [refresh]);

  const multiRole = identities.filter((i) => new Set(i.roles.map((r) => r.app)).size > 1).length;

  return (
    <View>
      <Row wrap gap={10} style={{ marginBottom: 14 }}>
        <Stat label="Identities" value={identities.length} />
        <Stat label="Linked across apps" value={multiRole} tone={THEMES.partner.primary} />
        <Stat label="Duplicate candidates (R2)" value={dupes.length} tone={dupes.length ? C.danger : undefined} />
        <Stat label="KYC awaiting review" value={identities.filter((i) => i.kyc.status === 'Submitted').length} />
      </Row>

      <Row wrap gap={6} style={{ marginBottom: 14 }}>
        {(
          [
            ['identities', 'Identities'],
            ['audit', 'Audit log'],
            ['phase1', 'Phase 1 & bootstrap'],
            ['switches', 'Remote switch'],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <Chip key={k} label={label} colour={theme.primary} active={tab === k} onPress={() => setTab(k)} />
        ))}
        <View style={{ flex: 1 }} />
        <Button small kind="ghost" label="Sign out" theme={theme} onPress={onSignOut} />
      </Row>

      {error && <Notice tone="danger">{error}</Notice>}
      {tab === 'identities' && <Identities api={api} token={t} identities={identities} onChange={refresh} />}
      {tab === 'audit' && <Audit rows={audit} />}
      {tab === 'phase1' && <Phase1 api={api} token={t} dupes={dupes} onChange={refresh} />}
      {tab === 'switches' && <Switches api={api} token={t} onReset={onSignOut} />}
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <View style={[s.card, { marginBottom: 0, paddingVertical: 12, minWidth: 150, flexGrow: 1 }]}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: tone ?? C.text }}>{value}</Text>
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

function Identities({ api, token, identities, onChange }: { api: Api; token: string; identities: Profile[]; onChange: () => void }) {
  if (identities.length === 0)
    return (
      <Card>
        <Text style={s.muted}>No identities yet.</Text>
      </Card>
    );
  return (
    <View>
      {identities.map((i) => (
        <Card key={i.identityId} style={{ paddingVertical: 12 }}>
          <Row wrap style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ minWidth: 220, flex: 1 }}>
              <Row gap={8}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>{i.displayName}</Text>
                {i.source !== 'native' && (
                  <Badge label={i.source === 'legacy-partner-app' ? 'Phase 1 · Partner' : 'Phase 1 · User'} tone="muted" />
                )}
              </Row>
              <Text style={[s.mono, { color: C.muted, marginTop: 2 }]}>{i.identityId}</Text>
              <View style={{ marginTop: 6, gap: 2 }}>
                {i.contacts.map((c) => (
                  <Text key={c.type + c.value} style={{ fontSize: 13, color: c.verified ? C.text : C.muted }}>
                    {c.verified ? '✓' : '○'} {c.value}
                  </Text>
                ))}
              </View>
            </View>
            <View style={{ minWidth: 200, flex: 1, gap: 8 }}>
              <Row wrap gap={6}>
                {i.roles.map((r) => (
                  <Chip
                    key={r.role}
                    label={`${ROLE_LABELS[r.role]} · ${APP_LABELS[r.grantedVia] ?? r.grantedVia}`}
                    colour={APP_COLOURS[ROLE_APP[r.role]]}
                  />
                ))}
              </Row>
              <Row gap={8}>
                <Text style={s.muted}>KYC</Text>
                <Badge
                  label={i.kyc.status === 'NotStarted' ? 'Not started' : i.kyc.status}
                  tone={i.kyc.status === 'Verified' ? 'ok' : i.kyc.status === 'Submitted' ? 'warn' : 'muted'}
                />
                {i.kyc.docType && (
                  <Text style={s.muted}>
                    {i.kyc.docType} {i.kyc.docRefMasked}
                  </Text>
                )}
                {i.kyc.status === 'Submitted' && (
                  <Button small label="Verify" theme={theme} onPress={() => api.admin.verifyKyc(token, i.identityId).then(onChange)} />
                )}
              </Row>
            </View>
          </Row>
        </Card>
      ))}
    </View>
  );
}

function Audit({ rows }: { rows: AuditRow[] }) {
  const [hideNoise, setHideNoise] = useState(true);
  const shown = hideNoise ? rows.filter((r) => r.action !== 'OTP_REQUESTED') : rows;
  return (
    <Card
      title="Every identity and linking decision"
      right={
        <Row gap={6}>
          <Text style={s.muted}>Hide OTP requests</Text>
          <Switch value={hideNoise} onValueChange={setHideNoise} />
        </Row>
      }
    >
      {shown.map((r) => (
        <View key={r.id} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border }}>
          <Row wrap gap={8}>
            <Text style={[s.mono, { color: C.muted }]}>{new Date(r.at).toLocaleTimeString()}</Text>
            <Badge label={r.action} tone={ACTION_TONE[r.action] ?? 'muted'} />
            {r.client && (
              <Text style={{ fontSize: 12, fontWeight: '700', color: APP_COLOURS[r.client] ?? C.muted }}>
                {APP_LABELS[r.client] ?? r.client}
              </Text>
            )}
            {r.identityName && <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>{r.identityName}</Text>}
          </Row>
          {r.detail && (
            <Text style={[s.muted, { marginTop: 3 }]}>
              {Object.entries(r.detail)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') || '—' : String(v)}`)
                .join('  ·  ')}
            </Text>
          )}
        </View>
      ))}
    </Card>
  );
}

function Phase1({ api, token, dupes, onChange }: { api: Api; token: string; dupes: DuplicateGroup[]; onChange: () => void }) {
  const [rows, setRows] = useState<Phase1Row[]>([]);
  const [report, setReport] = useState<BootstrapReport | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.admin.phase1(token).then(setRows), [api, token]);
  useEffect(() => {
    load();
  }, [load]);

  const run = async () => {
    setBusy(true);
    try {
      setReport(await api.admin.bootstrap(token));
      await load();
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Card title="Bootstrap (R1): load every Phase 1 account 1:1">
        <Text style={[s.body, { marginBottom: 12 }]}>
          Existing User and Partner app accounts are copied into the identity store, one identity each. Their contacts stay unverified until
          the person proves ownership by OTP. Duplicates are reported, not merged: merging needs SportSeek-approved rules (R2).
        </Text>
        {report && (
          <Notice tone="ok" title="Bootstrap complete">
            {`${report.identitiesCreated} identities created from ${report.phase1UserApp} User App + ${report.phase1PartnerApp} Partner App accounts` +
              `${report.alreadyMapped ? ` (${report.alreadyMapped} already loaded)` : ''}. ${report.duplicateCandidates.length} duplicate candidate group(s).`}
          </Notice>
        )}
        <Button label="Run bootstrap" theme={theme} busy={busy} onPress={run} />
      </Card>

      <Card title={`Duplicate candidates for the R2 merge (${dupes.length})`}>
        {dupes.length === 0 && <Text style={s.muted}>None yet. Run the bootstrap.</Text>}
        {dupes.map((g) => (
          <View key={g.value} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border }}>
            <Text style={{ fontWeight: '800', color: C.danger }}>{g.value}</Text>
            {g.identities.map((m) => (
              <Text key={m.identityId} style={s.muted}>
                {m.verified ? '✓' : '○'} {m.displayName} · {m.roles.map((r) => ROLE_LABELS[r]).join(', ')} · {m.source}
              </Text>
            ))}
          </View>
        ))}
      </Card>

      <Card title="Phase 1 tables (schema legacy, read-only)">
        {rows.map((r) => (
          <Row key={r.app + r.id} wrap gap={8} style={{ paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.border }}>
            <Text style={{ width: 90, fontSize: 12, fontWeight: '700', color: APP_COLOURS[r.app] }}>
              {APP_LABELS[r.app]} #{r.id}
            </Text>
            <Text style={{ width: 170, fontSize: 13, color: C.text }}>{r.businessName ?? r.name}</Text>
            <Text style={[s.mono, { width: 130 }]}>{r.mobile}</Text>
            <Text style={[s.mono, { flex: 1, minWidth: 160 }]}>{r.email ?? '—'}</Text>
            <Badge label={r.identityId ? 'Loaded' : 'Not loaded'} tone={r.identityId ? 'ok' : 'muted'} />
          </Row>
        ))}
      </Card>
    </View>
  );
}

function Switches({ api, token, onReset }: { api: Api; token: string; onReset: () => void }) {
  const [f3, setF3] = useState<boolean | null>(null);
  const [min, setMin] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    api.admin.flags(token).then((f) => {
      setF3(f.sharedIdentityEnabled);
      setMin(f.minAppVersion);
    });
  }, [api, token]);

  const save = async (body: { sharedIdentityEnabled?: boolean; minAppVersion?: string }) => {
    const f = await api.admin.setFlags(token, body);
    setF3(f.sharedIdentityEnabled);
    setMin(f.minAppVersion);
    setSaved(`Saved at ${new Date().toLocaleTimeString()}. The apps pick this up within a few seconds.`);
  };

  return (
    <View>
      <Card title="F3 Shared Identity (remote switch)">
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>{f3 ? 'ON: Shared Identity' : 'OFF: Phase 1 login'}</Text>
            <Text style={s.muted}>
              Switching off sends the User and Partner apps back to the Phase 1 login. Identity data is additive, so switching back on loses
              nothing.
            </Text>
          </View>
          {f3 !== null && <Switch value={f3} onValueChange={(v) => save({ sharedIdentityEnabled: v })} />}
        </Row>
      </Card>
      <Card title="Minimum app version">
        <Text style={[s.muted, { marginBottom: 10 }]}>The demo apps are version 1.0.0. Set 1.1.0 to see them ask for an update.</Text>
        <Field label="Minimum version" value={min} onChangeText={setMin} />
        <Row>
          <Button small label="Save" theme={theme} onPress={() => save({ minAppVersion: min })} />
          <Button small kind="ghost" label="Reset to 1.0.0" theme={theme} onPress={() => save({ minAppVersion: '1.0.0' })} />
        </Row>
      </Card>
      {saved && <Notice tone="ok">{saved}</Notice>}
      <Card title="Demo">
        <Text style={[s.muted, { marginBottom: 10 }]}>
          Reset clears every identity except the admin and restores the Phase 1 data, for a fresh run.
        </Text>
        {confirmReset ? (
          <Row>
            <Button
              small
              kind="danger"
              label="Yes, reset demo data"
              theme={theme}
              onPress={() => api.admin.resetDemo(token).then(onReset)}
            />
            <Button small kind="ghost" label="Cancel" theme={theme} onPress={() => setConfirmReset(false)} />
          </Row>
        ) : (
          <Button small kind="ghost" label="Reset demo data…" theme={theme} onPress={() => setConfirmReset(true)} />
        )}
      </Card>
      {Platform.OS === 'web' && <Text style={[s.muted, { textAlign: 'center' }]}>Admin Portal · Shared Identity POC</Text>}
    </View>
  );
}
