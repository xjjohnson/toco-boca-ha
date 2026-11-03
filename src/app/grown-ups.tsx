import { ScrollView, StyleSheet, Switch, Text, TextInput, View, Pressable } from 'react-native';
import { useEffect, useState } from 'react';

import { StatusPill } from '@/components/StatusPill';
import { colors, radius, spacing } from '@/constants/theme';
import type { HaEvent, OutboundAction } from '@/ha/types';
import { GAME_EVENT } from '@/ha/inbound';
import { useSettings } from '@/store/settings';
import { useSyncQueue } from '@/store/syncQueue';
import { useWorld } from '@/store/world';
import { WebSocketTransport } from '@/ha/websocketTransport';
import { useConnection } from '@/store/connection';
import { applyConnectionSettings, haAddress, stubTransport, syncManager } from '@/sync';

function describe(action: OutboundAction): string {
  return action.kind === 'fireEvent'
    ? `event ${action.eventType} ${JSON.stringify(action.data ?? {})}`
    : `${action.domain}.${action.service} ${JSON.stringify(action.data ?? {})}`;
}

const PRETEND_EVENTS: { label: string; event: HaEvent }[] = [
  { label: 'Night', event: { eventType: GAME_EVENT, data: { reaction: 'night' } } },
  { label: 'Day', event: { eventType: GAME_EVENT, data: { reaction: 'day' } } },
  { label: 'Visitor', event: { eventType: GAME_EVENT, data: { reaction: 'visitor', who: 'Grandma' } } },
  { label: 'Celebrate', event: { eventType: GAME_EVENT, data: { reaction: 'celebrate' } } },
];

/**
 * Grown-ups only: connection status, the waiting queue, and controls for the
 * pretend house. Step 4 turns this into the full parent settings screen.
 */
export default function GrownUps() {
  const settings = useSettings();
  const queue = useSyncQueue();
  const resetWorld = useWorld((s) => s.reset);
  const [houseUp, setHouseUp] = useState(stubTransport.reachable);
  const transportName = useConnection((s) => s.transportName);
  const active = syncManager.getTransport();
  const usingStub = active === stubTransport;
  const lastError = active instanceof WebSocketTransport ? active.lastError : null;
  const autoAddress = haAddress({ haUrl: '' });
  const [, rerender] = useState(0);

  // The pretend house's inbox isn't a store; refresh it while this screen is open.
  useEffect(() => {
    const id = setInterval(() => rerender((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const setHouse = (up: boolean) => {
    stubTransport.setReachable(up);
    setHouseUp(up);
    if (up) void syncManager.connect();
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <StatusPill />

      <Section title="Offline testing">
        <Row label="Pretend this device is offline">
          <Switch
            value={settings.simulateOffline}
            onValueChange={(v) => settings.update({ simulateOffline: v })}
          />
        </Row>
        {usingStub && (
          <Row label="Pretend house is reachable">
            <Switch value={houseUp} onValueChange={setHouse} />
          </Row>
        )}
      </Section>

      <Section title={`Waiting to send (${queue.items.length})`}>
        {queue.items.length === 0 ? (
          <Text style={styles.muted}>
            Nothing waiting.
            {queue.lastSyncedAt ? ` Last synced ${new Date(queue.lastSyncedAt).toLocaleTimeString()}.` : ''}
          </Text>
        ) : (
          queue.items.map((q) => (
            <Text key={q.id} style={styles.mono}>
              {describe(q.action)}
              {q.attempts ? `  (tried ${q.attempts}×)` : ''}
            </Text>
          ))
        )}
        <View style={styles.buttons}>
          <Button label="Send now" onPress={() => void syncManager.connect()} />
          <Button label="Clear" onPress={queue.clear} />
        </View>
      </Section>

      {usingStub && (
        <>
      <Section title="Pretend house: send an event to the game">
        <View style={styles.buttons}>
          {PRETEND_EVENTS.map((p) => (
            <Button key={p.label} label={p.label} onPress={() => stubTransport.emit(p.event)} />
          ))}
        </View>
      </Section>

      <Section title={`Pretend house: received (${stubTransport.received.length})`}>
        {stubTransport.received.length === 0 ? (
          <Text style={styles.muted}>Nothing yet. Tap the lamp in the playroom.</Text>
        ) : (
          stubTransport.received
            .slice(-8)
            .reverse()
            .map((a, i) => (
              <Text key={i} style={styles.mono}>
                {describe(a)}
              </Text>
            ))
        )}
      </Section>

        </>
      )}

      <Section title={`Home Assistant · using ${transportName || 'nothing yet'}`}>
        {lastError && <Text style={styles.error}>{lastError}</Text>}
        <Text style={styles.muted}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder={autoAddress || 'https://your-home.ui.nabu.casa or http://192.168.1.5:8123'}
          value={settings.haUrl}
          onChangeText={(haUrl) => settings.update({ haUrl })}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Long-lived access token"
          value={settings.haToken}
          onChangeText={(haToken) => settings.update({ haToken })}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Text style={styles.muted}>Light the toy lamp controls (entity id)</Text>
        <TextInput
          style={styles.input}
          placeholder="light.play_room"
          value={settings.lampEntity}
          onChangeText={(lampEntity) => settings.update({ lampEntity })}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.muted}>
          Saved on this device only. Leave the token empty to use the pretend house.
        </Text>
        <Button label="Connect" onPress={applyConnectionSettings} />
      </Section>

      <Section title="Saves">
        <Button label="Start the playroom over" onPress={resetWorld} />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.body}>{label}</Text>
      {children}
    </View>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.button} accessibilityRole="button">
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg, gap: spacing.lg, alignItems: 'flex-start' },
  section: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  body: { fontSize: 17, color: colors.text, flexShrink: 1 },
  muted: { fontSize: 15, color: colors.textMuted },
  error: { fontSize: 15, color: '#C62828', fontWeight: '700' },
  mono: { fontSize: 14, color: colors.text, fontFamily: 'monospace' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
  input: {
    borderWidth: 2,
    borderColor: colors.off,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
});
