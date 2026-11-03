# Putting Toybox Town on Home Assistant

The game is a web app that Home Assistant serves from its `www` folder. Once a
tablet has opened it, it's saved on the tablet and keeps working with no
connection. When the house is back in reach, the game catches up on what
changed (stars, lights, music) by itself.

## Install or update

1. Download `toybox-town-web.zip` from the
   [Latest web app](https://github.com/xjjohnson/toco-boca-ha/releases/tag/latest-web) release. (Each merge to `main`
   rebuilds it.)
2. In your Home Assistant config folder (the one with `configuration.yaml`), make
   the folder `www/toybox-town/` and unzip everything into it, so you have
   `www/toybox-town/index.html`. The File editor or Samba add-on both work.
   If `www` didn't exist before, restart Home Assistant once.
3. Open `https://<your Home Assistant address>/local/toybox-town/index.html`. (Use the full `index.html` address: Home Assistant answers 403 for the bare folder address.)

To update, replace the folder's contents with the new zip. Tablets pick up the
new version the next time the game is opened while online.

## Easier option: the Home Assistant add-on

Instead of unzipping into `www`, you can install the game as an add-on that
updates with one restart. It serves the game on its own port, so there is no
`/local/...` address and no 403.

1. Settings → Add-ons → Add-on Store → ⋮ → *Repositories*, add
   `https://github.com/xjjohnson/toco-boca-ha`.
2. Install *Toybox Town web*, turn on *Start on boot*, and start it.
3. Press *Open Web UI* on the add-on page, or open `http://<your Home Assistant address>:8099/` on the tablet.
4. In the Grown-ups screen, enter your Home Assistant address (for example
   `http://192.168.1.231:8123`) and your access token. The address doesn't fill
   itself in here, because the game is on a different port than Home Assistant.

To update, restart the add-on: it downloads the newest build (the
`toybox-town-addon-web.zip` on the Latest web app release) each time it
starts, and keeps the last copy if it's offline. If Home Assistant is on
https, the game must be on https too, or the browser blocks the connection.

## Put it on a tablet's home screen

- **Android (Chrome):** open the address above, then menu → *Install app*.
- **iPad (Safari):** Share → *Add to Home Screen*.

It opens full screen, like a regular app.

> Working offline and installing need **https** (for example Home Assistant
> Cloud, or the Let's Encrypt / DuckDNS add-ons). Over plain
> `http://homeassistant.local:8123` the game still plays, but the browser won't
> save it for offline use.

## Add it to the Home Assistant sidebar (optional)

Settings → Dashboards → *Add dashboard* → *Webpage*, and use the URL
`/local/toybox-town/index.html`.

## Good to know

- Files in `www` can be opened by anyone who can reach your Home Assistant,
  without logging in. The game build has no secrets in it; the access token you
  enter in the Grown-ups screen stays on that tablet.
- The Grown-ups screen opens by pressing and holding the ⚙︎ button for a
  second, so little fingers don't wander in.

## Connect the game to your house

The game only **listens** to Home Assistant. It never switches a light, starts
the vacuum or plays music; the connection has no way to send a command.

1. In Home Assistant, open your profile → *Security* → *Long-lived access
   tokens* → *Create token*.
2. On the tablet, open the Grown-ups screen (press and hold ⚙︎), paste the
   token, and press *Connect*. The address fills itself in when the game is
   served from Home Assistant.
3. Under *What the game listens to*, press *Show choices* and pick:
   - a light (or light group) for each game room: Bedroom, Bathroom, Kitchen,
     Living room. The game room glows in the real light's color and goes dim
     when it's off.
   - your robot vacuum. While it cleans, a little vacuum roams the game house.
   - music players. While any of them plays, the characters dance and notes
     float up.
4. Press *Connect* again.

> Tip: a token from a non-admin Home Assistant user works for everything
> except the `toybox_town` event below, which Home Assistant only lets admin
> tokens listen to.

## Give the kids stars

Stars come from the **Toybox Town integration**, which adds a
`toybox_town.add_points` action and a `sensor.toybox_town_points` sensor.

### Install the integration

- **HACS:** HACS → ⋮ → *Custom repositories*, add
  `https://github.com/xjjohnson/toco-boca-ha` as an *Integration*, then install
  *Toybox Town* and restart Home Assistant.
- **By hand:** copy `custom_components/toybox_town` from this repo into your
  config folder's `custom_components/` and restart.

Then Settings → Devices & services → *Add integration* → *Toybox Town*.

### Give points

Call the action from an automation, a script or a dashboard button:

```yaml
action: toybox_town.add_points
data:
  amount: 5
  child: Lily          # optional, kept on the sensor for your records
  reason: Tidied up    # optional
```

The sensor holds every point ever given (it only goes up and survives
restarts). The game watches it and turns each increase into stars, so points
given while a tablet is offline arrive when it reconnects. Kids spend stars in
the game on outfits and toys; that works offline too.

A tablet only counts points added after it first connects, so a new or reset
tablet doesn't get the whole history at once. The Grown-ups screen also has
+1 / +5 / −1 buttons.

Each call also fires `toybox_town_points_added` with `{amount, child, reason,
total}`, if you want an automation to say "well done!" too.

Prefer your own helper? Set the points entity in the Grown-ups screen to any
`input_number` or `counter` you raise instead.

## Events from the house (optional)

Automations can also send the game a `toybox_town` event (needs an admin token,
see above):

| Event data | What the game does |
| --- | --- |
| `{reaction: night}` / `{reaction: day}` | The windows and rooms go dark or light |
| `{reaction: visitor, who: Grandma}` | A "Knock knock!" banner |
| `{reaction: celebrate}` | A big "Hooray!" |
| `{reaction: points, add: 5}` | 5 stars right away (only if the tablet is connected at that moment) |
| `{reaction: toy, toy: radio, on: true}` | Switches a toy in the game (radio, lamp, tv, tub, fridge, toaster) |

In an automation or script (YAML mode):

```yaml
- event: toybox_town
  event_data:
    reaction: night
```
