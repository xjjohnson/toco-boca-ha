import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { StatusPill } from '@/components/StatusPill';
import { colors, radius, spacing } from '@/constants/theme';
import { GAME_EVENT } from '@/ha/inbound';
import type { EntityState } from '@/ha/types';
import { WebSocketTransport } from '@/ha/websocketTransport';
import { ROOMS, THINGS, type RoomId, type ThingKind } from '@/play/catalog';
import { useConnection } from '@/store/connection';
import { useHouse } from '@/store/house';
import { useSettings } from '@/store/settings';
import { useWallet } from '@/store/wallet';
import { useWorld } from '@/store/world';
import { applyConnectionSettings, haAddress, inboundContext, PRETEND, stubTransport, syncManager } from '@/sync';

/**
 * Grown-ups only: stars, the Home Assistant connection, which house things
 * the game listens to, and a pretend house to try every reaction. The game
 * only ever listens to Home Assistant; nothing here lets it change the house.
 */
export default function GrownUps() {
  const settings = useSettings();
  const wallet = useWallet();
  const resetWorld = useWorld((s) => s.reset);
  const [houseUp, setHouseUp] = useState(stubTransport.reachable);
  const transportName = useConnection((s) => s.transportName);
  const ha = useConnection((s) => s.ha);
  // Re-render when the pretend house changes, so its buttons show what's on.
  useHouse();
  const active = syncManager.getTransport();
  const usingStub = active === stubTransport;
  const lastError = active instanceof WebSocketTransport ? active.lastError : null;
  const autoAddress = haAddress({ haUrl: '' });
  const [choices, setChoices] = useState<EntityState[] | null>(null);
  const [choicesError, setChoicesError] = useState<string | null>(null);

  const setHouse = (up: boolean) => {
    stubTransport.setReachable(up);
    setHouseUp(up);
    if (up) void syncManager.connect();
  };

  const loadChoices = async () => {
    setChoicesError(null);
    try {
      setChoices(await active.listEntities());
    } catch (e) {
      setChoicesError(`Couldn't list things from Home Assistant: ${(e as Error).message}`);
    }
  };

  // The pretend house drives the same entities the game is listening for.
  const pretend = inboundContext(settings, true);
  const stubState = (id: string) => stubTransport.getEntity(id)?.state;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <StatusPill />

      <Section title={`Stars: ${wallet.stars} ⭐`}>
        <Text style={styles.muted}>
          Kids spend stars on outfits and toys, even offline. Give stars from Home Assistant with the “Toybox Town: Add
          points” action (toybox_town.add_points) in an automation, script or dashboard button. Points given while the
          tablet is offline arrive when it reconnects.
        </Text>
        <View style={styles.buttons}>
          <Button label="−1" onPress={() => wallet.setStars(wallet.stars - 1)} />
          <Button label="+1" onPress={() => wallet.setStars(wallet.stars + 1)} />
          <Button label="+5" onPress={() => wallet.setStars(wallet.stars + 5)} />
        </View>
      </Section>

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
        <Text style={styles.muted}>
          The game only listens: it never switches lights, starts the vacuum or plays music. The token stays on this
          tablet. Leave it empty to use the pretend house.
        </Text>
        <Button label="Connect" onPress={applyConnectionSettings} />
      </Section>

      <Section title="What the game listens to">
        <Text style={styles.muted}>
          Type entity ids, or connect and tap “Show choices” to pick them. Press Connect again after changing these.
        </Text>
        {!usingStub && ha === 'connected' && <Button label="Show choices" onPress={() => void loadChoices()} />}
        {choicesError && <Text style={styles.error}>{choicesError}</Text>}

        <EntityField
          label="Points (the Toybox Town integration's sensor, or an input_number or counter)"
          placeholder="sensor.toybox_town_points"
          value={settings.pointsEntity}
          domains={['sensor', 'input_number', 'counter']}
          choices={choices}
          onChange={(pointsEntity) => settings.update({ pointsEntity })}
        />
        {(Object.keys(ROOMS) as RoomId[]).map((room) => (
          <EntityField
            key={room}
            label={`${ROOMS[room].name} light`}
            placeholder={`light.${room}`}
            value={settings.roomLights[room] ?? ''}
            domains={['light']}
            choices={choices}
            onChange={(id) => settings.update({ roomLights: { ...settings.roomLights, [room]: id } })}
          />
        ))}
        <EntityField
          label="Robot vacuum"
          placeholder="vacuum.robot"
          value={settings.vacuumEntity}
          domains={['vacuum']}
          choices={choices}
          onChange={(vacuumEntity) => settings.update({ vacuumEntity })}
        />
        <EntityField
          label="Music players (separate with commas)"
          placeholder="media_player.kids_room, media_player.kitchen"
          value={settings.musicEntities.join(', ')}
          domains={['media_player']}
          choices={choices}
          multiple
          onChange={(text) =>
            settings.update({
              musicEntities: text
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean),
            })
          }
        />
      </Section>

      {usingStub && (
        <Section title="Pretend house: try what the game does">
          <Text style={styles.muted}>Day and night, visitors and parties</Text>
          <View style={styles.buttons}>
            {(['night', 'day', 'celebrate'] as const).map((reaction) => (
              <Button key={reaction} label={reaction} onPress={() => stubTransport.emit({ eventType: GAME_EVENT, data: { reaction } })} />
            ))}
            <Button
              label="visitor"
              onPress={() => stubTransport.emit({ eventType: GAME_EVENT, data: { reaction: 'visitor', who: 'Grandma' } })}
            />
          </View>

          <Text style={styles.muted}>Stars (like calling toybox_town.add_points with 3)</Text>
          <View style={styles.buttons}>
            <Button
              label="Give 3 stars"
              onPress={() => {
                const id = pretend.pointsEntity!;
                // The first value is only remembered, like a newly connected tablet; then each raise counts.
                const now = Number(stubState(id) ?? NaN);
                if (Number.isNaN(now)) stubTransport.setEntity(id, '0');
                stubTransport.setEntity(id, String((Number.isNaN(now) ? 0 : now) + 3));
              }}
            />
          </View>

          <Text style={styles.muted}>Room lights</Text>
          {(Object.keys(ROOMS) as RoomId[]).map((room) => {
            const id = pretend.roomLights?.[room] ?? PRETEND.light(room);
            return (
              <View key={room} style={styles.buttons}>
                <Text style={[styles.body, styles.roomLabel]}>{ROOMS[room].name}</Text>
                {LIGHT_PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    label={p.label}
                    onPress={() => stubTransport.setEntity(id, p.rgb ? 'on' : 'off', p.rgb ? { rgb_color: p.rgb, brightness: 255 } : {})}
                  />
                ))}
              </View>
            );
          })}

          <Text style={styles.muted}>Robot vacuum and music</Text>
          <View style={styles.buttons}>
            <Button
              label={stubState(pretend.vacuumEntity!) === 'cleaning' ? 'Vacuum: dock' : 'Vacuum: clean'}
              onPress={() =>
                stubTransport.setEntity(pretend.vacuumEntity!, stubState(pretend.vacuumEntity!) === 'cleaning' ? 'docked' : 'cleaning')
              }
            />
            {(pretend.musicEntities ?? []).slice(0, 1).map((id) => (
              <Button
                key={id}
                label={stubState(id) === 'playing' ? 'Music: stop' : 'Music: play'}
                onPress={() => stubTransport.setEntity(id, stubState(id) === 'playing' ? 'paused' : 'playing')}
              />
            ))}
          </View>
        </Section>
      )}

      <Section title="Offline testing">
        <Row label="Pretend this tablet is offline">
          <Switch value={settings.simulateOffline} onValueChange={(v) => settings.update({ simulateOffline: v })} />
        </Row>
        {usingStub && (
          <Row label="Pretend house is reachable">
            <Switch value={houseUp} onValueChange={setHouse} />
          </Row>
        )}
      </Section>

      <Section title="Saves">
        <Text style={styles.muted}>Puts every toy and character back. Stars and bought things are kept.</Text>
        <Button
          label="Start the house over"
          onPress={() => resetWorld(wallet.owned.filter((id): id is ThingKind => id in THINGS))}
        />
      </Section>
    </ScrollView>
  );
}

const LIGHT_PRESETS: { label: string; rgb: [number, number, number] | null }[] = [
  { label: 'Off', rgb: null },
  { label: 'Warm', rgb: [255, 214, 150] },
  { label: 'Red', rgb: [255, 60, 60] },
  { label: 'Blue', rgb: [60, 120, 255] },
  { label: 'Purple', rgb: [170, 80, 255] },
];

function EntityField({
  label,
  placeholder,
  value,
  domains,
  choices,
  multiple,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  domains: string[];
  choices: EntityState[] | null;
  multiple?: boolean;
  onChange: (value: string) => void;
}) {
  const matching = (choices ?? []).filter((e) => domains.includes(e.entity_id.split('.')[0])).slice(0, 60);
  const pick = (id: string) => {
    if (!multiple) return onChange(id);
    const list = value.split(',').map((v) => v.trim()).filter(Boolean);
    onChange((list.includes(id) ? list.filter((v) => v !== id) : [...list, id]).join(', '));
  };
  return (
    <View style={styles.field}>
      <Text style={styles.body}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {matching.length > 0 && (
        <View style={styles.chips}>
          {matching.map((e) => {
            const name = typeof e.attributes.friendly_name === 'string' ? e.attributes.friendly_name : e.entity_id;
            const chosen = value.split(',').map((v) => v.trim()).includes(e.entity_id);
            return (
              <Pressable key={e.entity_id} onPress={() => pick(e.entity_id)} style={[styles.chip, chosen && styles.chipOn]}>
                <Text style={styles.chipText}>{name}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
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
  roomLabel: { width: 110, alignSelf: 'center' },
  muted: { fontSize: 15, color: colors.textMuted },
  error: { fontSize: 15, color: '#C62828', fontWeight: '700' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
  field: { gap: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 2,
    borderColor: colors.off,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.off,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipOn: { borderColor: colors.good, backgroundColor: '#E3F7EE' },
  chipText: { fontSize: 14, color: colors.text },
});
