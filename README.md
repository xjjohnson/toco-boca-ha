# Toybox Town

A pretend-play toy house for kids that plays along with Home Assistant: things
in the house change the game, and things in the game can do things in the house.
All art and names are original.

Built with Expo, React Native and TypeScript, the same stack as
[math-game](https://github.com/xjjohnson/math-game). It runs as an installable
offline web app hosted by Home Assistant now, and the same code becomes a native
app with over-the-air updates later. See [docs/build-plan.md](docs/build-plan.md).

## Status

- [x] Step 1: foundation. Installable offline web app, saves on the device, a
  saved queue that syncs with Home Assistant on reconnect, pretend Home
  Assistant for testing, a test playroom (lamp, draggable ball) and a Grown-ups
  screen
- [ ] Step 2: play core (rooms, characters, drag and drop, dress-up)
- [ ] Step 3: two-way Home Assistant triggers
- [ ] Step 4: more content, parent settings, docs, native app with OTA updates

## Running it

```bash
npm install
npm run web          # dev server in a browser
npm test             # unit tests
npm run typecheck
```

Try the installable, offline build locally:

```bash
npm run export:web && npm run serve    # http://localhost:8080
```

Build it the way Home Assistant serves it (under `/local/toybox-town/`):

```bash
npm run export:ha
TOYBOX_BASE_URL=/local/toybox-town npm run serve
```

To put it on Home Assistant, see [docs/home-assistant.md](docs/home-assistant.md).

## How it fits together

| Piece | Where |
| --- | --- |
| Screens (Expo Router) | `src/app/` |
| Saves (zustand, persisted) | `src/store/` (`storage.web.ts` uses IndexedDB, `storage.ts` AsyncStorage) |
| Sync queue (pure logic, tested) | `src/sync/queue.ts` |
| Reconnect and flush | `src/sync/syncManager.ts`, wired up in `src/sync/index.ts` |
| Home Assistant interface, stub, event mapping | `src/ha/` |
| PWA (manifest, service worker) | `scripts/build-pwa.js`, `scripts/sw-template.js` |

Game code calls `tellHome(action, coalesceKey?)` from `src/sync`. The action is
saved right away and sent when the house is reachable. Actions with the same
`coalesceKey` replace each other (ten lamp taps offline send one "lamp is off"),
and actions older than 30 minutes are dropped instead of sent.
