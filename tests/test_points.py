"""The add_points action and the points sensor the game reads."""

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, mock_restore_cache_with_extra_data

from homeassistant import config_entries
from homeassistant.core import HomeAssistant, State
from homeassistant.exceptions import ServiceValidationError
from homeassistant.setup import async_setup_component

from custom_components.toybox_town.const import DOMAIN, EVENT_POINTS_ADDED

SENSOR = "sensor.toybox_town_points"


async def setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="Toybox Town", data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_adds_points(hass: HomeAssistant) -> None:
    await setup(hass)
    assert hass.states.get(SENSOR).state == "0"

    events = []
    hass.bus.async_listen(EVENT_POINTS_ADDED, events.append)
    result = await hass.services.async_call(
        DOMAIN, "add_points", {"amount": 5, "child": "Lily", "reason": "Tidy room"}, blocking=True, return_response=True
    )
    await hass.services.async_call(DOMAIN, "add_points", {"amount": 2, "child": "Olivia"}, blocking=True)
    await hass.async_block_till_done()

    state = hass.states.get(SENSOR)
    assert result == {"total": 5}
    assert state.state == "7"
    assert state.attributes["children"] == {"Lily": 5, "Olivia": 2}
    assert state.attributes["last_amount"] == 2
    assert [e.data["total"] for e in events] == [5, 7]


async def test_rejects_bad_amounts(hass: HomeAssistant) -> None:
    await setup(hass)
    for amount in (0, -3, 5000):
        with pytest.raises(Exception):
            await hass.services.async_call(DOMAIN, "add_points", {"amount": amount}, blocking=True)
    assert hass.states.get(SENSOR).state == "0"


async def test_needs_setting_up(hass: HomeAssistant) -> None:
    assert await async_setup_component(hass, DOMAIN, {})
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(DOMAIN, "add_points", {"amount": 1}, blocking=True)


async def test_keeps_the_total_across_restarts(hass: HomeAssistant) -> None:
    mock_restore_cache_with_extra_data(
        hass,
        [
            (
                State(SENSOR, "12", {"children": {"Lily": 12}}),
                {"native_value": 12, "native_unit_of_measurement": "points"},
            )
        ],
    )
    await setup(hass)
    await hass.services.async_call(DOMAIN, "add_points", {"amount": 1, "child": "Lily"}, blocking=True)
    state = hass.states.get(SENSOR)
    assert state.state == "13"
    assert state.attributes["children"] == {"Lily": 13}


async def test_config_flow_adds_one_entry(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] == "form"
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] == "create_entry"
    await hass.async_block_till_done()

    again = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert again["type"] == "abort"
    assert again["reason"] == "single_instance_allowed"
