/**
 * Adds the web base path on top of app.json. The web build that goes into
 * Home Assistant's www folder is served from /local/toybox-town/, so
 * `npm run export:ha` sets TOYBOX_BASE_URL to that. Everything else
 * (local dev, the native app) leaves it empty and serves from the root.
 */
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.TOYBOX_BASE_URL || '',
  },
});
