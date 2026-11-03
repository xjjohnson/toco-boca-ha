"""Lets Home Assistant load custom_components/toybox_town in tests."""

import pytest


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    yield
