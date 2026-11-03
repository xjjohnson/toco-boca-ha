# Putting Toybox Town on Home Assistant

The game is a web app that Home Assistant serves from its `www` folder. Once a
tablet has opened it, it's saved on the tablet and keeps working with no
connection. Anything the kids do while offline waits on the tablet and is sent
to Home Assistant when the connection comes back.

## Install or update

1. Download `toybox-town-web.zip` from the
   [Latest web app](https://github.com/xjjohnson/toco-boca-ha/releases/tag/latest-web) release. (Each merge to `main`
   rebuilds it.)
2. In your Home Assistant config folder (the one with `configuration.yaml`), make
   the folder `www/toybox-town/` and unzip everything into it, so you have
   `www/toybox-town/index.html`. The File editor or Samba add-on both work.
   If `www` didn't exist before, restart Home Assistant once.
3. Open `https://<your Home Assistant address>/local/toybox-town/`.

To update, replace the folder's contents with the new zip. Tablets pick up the
new version the next time the game is opened while online.

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
`/local/toybox-town/`.

## Good to know

- Files in `www` can be opened by anyone who can reach your Home Assistant,
  without logging in. The game build has no secrets in it; the access token you
  enter in the Grown-ups screen stays on that tablet.
- The Grown-ups screen opens by pressing and holding the ⚙︎ button for a
  second, so little fingers don't wander in.

## Events (from the next update)

Right now the game talks to a pretend house built into the app. When the real
connection is added, it will use two custom events:

| Direction | Event | Example data |
| --- | --- | --- |
| Game → house | `toybox_town_action` | `{toy: lamp, on: true}` |
| House → game | `toybox_town` | `{reaction: night}`, `{reaction: visitor, who: Grandma}`, `{reaction: celebrate}` |

So an automation can turn on a real light when the toy lamp is switched on, or
make the playroom go dark at bedtime.
