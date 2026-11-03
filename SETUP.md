# Toybox Town: try it and set it up

## Try the demo

A playable demo runs in the browser with no Home Assistant needed:
https://claude.ai/artifact/ASNMqJXEDEfNtvozkC8Axk (private to Justin's
claude.ai account). It uses the game's pretend house.

- Tap a room to zoom in. Tap the house button to zoom back out.
- Drag the kids and toys around. Tap a kid to dress them up.
- To fake what the house would do, press and hold ⚙︎ for about a second to
  open Grown-ups. Under **Pretend house**, tap *Give 3 stars*, a room light
  color, *Vacuum: clean* or *Music: play*, then go back to see the house react.

You can also run the same thing locally:

```bash
npm install
npm run export:web && npm run serve    # http://localhost:8080
```

## Set it up on your Home Assistant

1. **Put the game in Home Assistant.** Download `toybox-town-web.zip` from the
   [Latest web app](https://github.com/xjjohnson/toco-boca-ha/releases/tag/latest-web)
   release, unzip it into your config folder as `www/toybox-town/`, and open
   `https://<your Home Assistant>/local/toybox-town/` on the tablet.
2. **Install the integration for stars.** In HACS → ⋮ → *Custom repositories*,
   add `https://github.com/xjjohnson/toco-boca-ha` as an *Integration*,
   install *Toybox Town*, and restart. Then Settings → Devices & services →
   *Add integration* → *Toybox Town*. (Or copy `custom_components/toybox_town`
   into your config's `custom_components/` folder and restart.)
3. **Give stars** from an automation, script or dashboard button:

   ```yaml
   action: toybox_town.add_points
   data:
     amount: 5
   ```

4. **Make a token.** In your Home Assistant profile → *Security* →
   *Long-lived access tokens* → *Create token*.
5. **Connect the game.** In the game, open Grown-ups (press and hold ⚙︎),
   paste the token, and press *Connect*.
6. **Pick what it listens to.** Tap *Show choices*, pick a light for each
   room, your robot vacuum and your speakers, then press *Connect* again.

The game only listens to your house; it never switches lights or starts
anything. More detail, including the optional `toybox_town` events, is in
[docs/home-assistant.md](docs/home-assistant.md).
