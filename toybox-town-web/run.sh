#!/bin/sh
# Downloads the latest Toybox Town web build each time the add-on starts
# (restart the add-on to update). Keeps the last good copy if offline.
URL="https://github.com/xjjohnson/toco-boca-ha/releases/download/latest-web/toybox-town-addon-web.zip"
CACHE=/data/toybox-town-addon-web.zip

if curl -fsSL --retry 3 -o /tmp/new.zip "$URL" && unzip -tq /tmp/new.zip >/dev/null; then
  mv /tmp/new.zip "$CACHE"
  echo "Downloaded the latest Toybox Town web app."
else
  echo "Could not download the latest build; using the saved copy if there is one."
fi

if [ -f "$CACHE" ]; then
  rm -rf /srv/www/*
  unzip -oq "$CACHE" -d /srv/www
else
  echo "No Toybox Town build available yet. Check that the latest-web release has toybox-town-addon-web.zip." >&2
  exit 1
fi

[ -f /srv/www/version.json ] && echo "Serving build: $(cat /srv/www/version.json)"
exec nginx -g 'daemon off;'
