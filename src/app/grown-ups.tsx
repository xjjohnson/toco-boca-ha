import { ScrollView, StyleSheet, Switch, Text, TextInput, View, Pressable } from 'react-native';
import { useEffect, useState } from 'react';

import { StatusPill } from '@/components/StatusPill';
import { colors, radius, spacing } from '@/constants/theme';
import type { HaEvent, OutboundAction } from '@/ha/types';
import { GAME_EVENT } from '@/ha/inbound';
import { useSettings } from '@/store/settings';
import { useSyncQueue } from '@/store/syncQueue';
import { useWorld } from '@/store/world';
import { syncManager, transport } from '@/sync';

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
  const [houseUp, setHouseUp] = useState(transport.reachable);
  const [, rerender] = useState(0);

  // The pretend house's inbox isn't a store; refresh it while this screen is open.
  useEffect(() => {
    const id = setInterval(() => rerender((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const setHouse = (up: boolean) => {
    transport.setReachable(up);
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
        <Row label="Pretend house is reachable">
          <Switch value={houseUp} onValueChange={setHouse} />
        </Row>
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

      <Section title="Pretend house: send an event to the game">
        <View style={styles.buttons}>
          {PRETEND_EVENTS.map((p) => (
            <Button key={p.label} label={p.label} onPress={() => transport.emit(p.event)} />
          ))}
        </View>
      </Section>

      <Section title={`Pretend house: received (${transport.received.length})`}>
        {transport.received.length === 0 ? (
          <Text style={styles.muted}>Nothing yet. Tap the lamp in the playroom.</Text>
        ) : (
          transport.received
            .slice(-8)
            .reverse()
            .map((a, i) => (
              <Text key={i} style={styles.mono}>
                {describe(a)}
              </Text>
            ))
        )}
      </Section>

      <Section title="Home Assistant (connects in a later update)">
        <TextInput
          style={styles.input}
          placeholder="http://homeassistant.local:8123"
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
        <Text style={styles.muted}>Saved on this device only.</Text>
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
