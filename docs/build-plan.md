# Build plan

1. **Foundation** (done): installable offline web app, saves on the device
   (IndexedDB on the web, AsyncStorage in the native app), and a pretend house
   behind the same interface as the real one.
2. **Listen-only Home Assistant** (done): the game reads the house and never
   sends it commands.
3. **Points** (done): the Toybox Town integration's `toybox_town.add_points`
   action raises `sensor.toybox_town_points`; the game turns each increase into
   stars, spent offline on outfits and toys.
4. **House reactions** (done): room light colors, the robot vacuum, music.
5. **Play core** (done): a zoomable two-story cutaway house with four rooms.
6. **Next**: more rooms and toys, then the native app with over-the-air updates.

## Native app with over-the-air updates

The project is Expo, like math-game, so the same code builds the Android (and
iOS) app. The plan for updates:

- `npx expo install expo-updates` and `npx eas-cli@latest update:configure`,
  which adds a `runtimeVersion` and update URL to the app config.
- JavaScript and art changes ship with `eas update --branch production` and
  reach installed apps on their next launch, no reinstall.
- Native changes (new native modules, SDK upgrades) still need a new build:
  `eas build`, or a GitHub Actions APK like math-game's.
