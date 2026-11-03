"""Toybox Town: give the kids points that they spend in the Toybox Town game.

The integration keeps one sensor, sensor.toybox_town_points, holding the
total points ever given. The game watches it and turns every increase into
stars. Points are given with the toybox_town.add_points action.
"""

from __future__ import annotations

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import (
    ATTR_AMOUNT,
    ATTR_CHILD,
    ATTR_REASON,
    DOMAIN,
    MAX_POINTS_PER_CALL,
    SERVICE_ADD_POINTS,
)

PLATFORMS = [Platform.SENSOR]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

ADD_POINTS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_AMOUNT): vol.All(vol.Coerce(int), vol.Range(min=1, max=MAX_POINTS_PER_CALL)),
        vol.Optional(ATTR_CHILD): cv.string,
        vol.Optional(ATTR_REASON): cv.string,
    }
)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the add_points action."""

    async def add_points(call: ServiceCall) -> dict[str, int]:
        sensor = hass.data.get(DOMAIN)
        if sensor is None:
            raise ServiceValidationError(
                "Toybox Town isn't set up yet. Add it under Settings > Devices & services.",
                translation_domain=DOMAIN,
                translation_key="not_set_up",
            )
        total = sensor.add_points(
            call.data[ATTR_AMOUNT],
            child=call.data.get(ATTR_CHILD),
            reason=call.data.get(ATTR_REASON),
        )
        return {"total": total}

    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_POINTS,
        add_points,
        schema=ADD_POINTS_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the points sensor."""
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the points sensor. The total is kept and comes back if it's added again."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        hass.data.pop(DOMAIN, None)
    return unloaded
