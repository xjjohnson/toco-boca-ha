"""The Toybox Town points sensor."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import RestoreSensor, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, EVENT_POINTS_ADDED


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Add the points sensor."""
    sensor = ToyboxPointsSensor(entry)
    hass.data[DOMAIN] = sensor
    async_add_entities([sensor])


class ToyboxPointsSensor(RestoreSensor):
    """Every point ever given. It only goes up; the game spends stars on its own side."""

    _attr_has_entity_name = True
    _attr_translation_key = "points"
    _attr_icon = "mdi:star-circle"
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_native_unit_of_measurement = "points"
    _attr_should_poll = False

    def __init__(self, entry: ConfigEntry) -> None:
        self._attr_unique_id = f"{entry.entry_id}_points"
        self.entity_id = "sensor.toybox_town_points"
        self._total = 0
        self._children: dict[str, int] = {}
        self._last: dict[str, Any] = {}

    async def async_added_to_hass(self) -> None:
        """Pick up the total from before a restart."""
        await super().async_added_to_hass()
        if (last := await self.async_get_last_sensor_data()) is not None and last.native_value is not None:
            try:
                self._total = int(float(last.native_value))
            except (TypeError, ValueError):
                self._total = 0
        if (state := await self.async_get_last_state()) is not None:
            children = state.attributes.get("children")
            if isinstance(children, dict):
                self._children = {str(k): int(v) for k, v in children.items() if isinstance(v, (int, float))}

    @property
    def native_value(self) -> int:
        return self._total

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"children": dict(self._children), **self._last}

    def add_points(self, amount: int, child: str | None = None, reason: str | None = None) -> int:
        """Give points. Returns the new total."""
        self._total += amount
        if child:
            self._children[child] = self._children.get(child, 0) + amount
        self._last = {"last_amount": amount, "last_child": child, "last_reason": reason}
        self.async_write_ha_state()
        self.hass.bus.async_fire(
            EVENT_POINTS_ADDED,
            {"amount": amount, "child": child, "reason": reason, "total": self._total},
        )
        return self._total
