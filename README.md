# Toybox Town

A pretend-play toy house for kids that plays along with Home Assistant. The
game only listens to the house: real light colors show in its rooms, the robot
vacuum's twin cleans when the real one does, characters dance when music plays,
and grown-ups give stars from Home Assistant that the kids spend on outfits and
toys. The game never switches, plays or changes anything in the house. All art
and names are original.

Built with Expo, React Native and TypeScript, the same stack as
[math-game](https://github.com/xjjohnson/math-game). It runs as an installable
offline web app hosted by Home Assistant now, and the same code becomes a native
app with over-the-air updates later. See [docs/build-plan.md](docs/build-plan.md).

**Try the demo and set it up: [SETUP.md](SETUP.md).**

## Status

- [x] Foundation: installable offline web app, saves on the device, a Grown-ups
  screen, a pretend house for testing
- [x] Listen-only Home Assistant connection (no commands, ever)
- [x] Points: the `toybox_town.add_points` action in Home Assistant, stars to
  spend in the game, offline
- [x] The game reacts to room light colors, a robot vacuum and music players
- [x] Play core: a zoomable two-story cutaway house with four rooms, three
  characters, drag and drop, dress-up and a toy box
- [ ] More content, then the native app with over-the-air updates

## Running it

```bash
npm install
npm run web          # dev server in a browser
npm test             # unit tests
npm run typecheck
python -m pytest     # the Home Assistant integration (pip install pytest-homeassistant-custom-component)
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
| Screens (Expo Router): the house and rooms, Grown-ups | `src/app/` |
| Rooms, toys, characters, outfits, prices (data) | `src/play/catalog.ts` |
| Drop rules, doors, house layout and zoom (pure logic, tested) | `src/play/scene.ts`, `src/play/house.ts` |
| Original art (SVG) | `src/art/` |
| Saves (zustand, persisted) | `src/store/` (`world.ts` the house, `wallet.ts` stars; `storage.web.ts` uses IndexedDB) |
| What the real house is doing (live, not saved) | `src/store/house.ts` |
| Home Assistant connection (listen-only), pretend house, event mapping | `src/ha/` |
| Reconnects and routes house reactions | `src/sync/` |
| Home Assistant integration (`toybox_town.add_points`) | `custom_components/toybox_town/`, tests in `tests/` |
| PWA (manifest, service worker) | `scripts/build-pwa.js`, `scripts/sw-template.js` |

House events are turned into game reactions by `reactionFor` in
`src/ha/inbound.ts`. To make the game react to something new, add a reaction
there and handle it in the store it belongs to.
