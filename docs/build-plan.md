# Build plan

1. **Foundation** (this step): installable offline web app, saves on the device
   (IndexedDB on the web, AsyncStorage in the native app), a saved queue that
   sends game actions to Home Assistant when the connection comes back, and a
   pretend Home Assistant (stub) behind the same interface the real one will use.
2. **Play core**: rooms, characters, drag and drop, dress-up. Original art only.
3. **Two-way Home Assistant**: a WebSocket transport in `src/ha/` replacing the
   stub (`src/sync/index.ts`), using the URL and token from the Grown-ups screen.
   House events become game reactions (`src/ha/inbound.ts`); game actions fire
   `toybox_town_action`.
4. **More content, parent settings, docs**, then the **native app with
   over-the-air updates**.

## Native app with over-the-air updates

The project is Expo, like math-game, so the same code builds the Android (and
iOS) app. The plan for updates:

- `npx expo install expo-updates` and `npx eas-cli@latest update:configure`,
  which adds a `runtimeVersion` and update URL to the app config.
- JavaScript and art changes ship with `eas update --branch production` and
  reach installed apps on their next launch, no reinstall.
- Native changes (new native modules, SDK upgrades) still need a new build:
  `eas build`, or a GitHub Actions APK like math-game's.
