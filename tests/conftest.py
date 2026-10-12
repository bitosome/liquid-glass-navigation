"""Use real Home Assistant lifecycle and websocket handlers with synthetic options."""
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.components import frontend
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry, mock_component

from custom_components.liquid_glass_navigation.const import DOMAIN


@pytest.fixture
async def navigation_environment(hass, enable_custom_integrations):
    mock_component(hass, "frontend")
    hass.data[frontend.DATA_EXTRA_MODULE_URL] = {"/unrelated-module.js"}
    assert await async_setup_component(hass, "websocket_api", {})
    # No frontend bundle is needed for backend tests; its bytes are validated by
    # the frontend build. Keep the real HTTP/websocket/auth stack.
    resources = SimpleNamespace(async_create_item=AsyncMock(), async_update_item=AsyncMock())
    hass.data["lovelace"] = SimpleNamespace(resources=resources)
    with patch.object(hass.http, "async_register_static_paths", new=AsyncMock()) as register:
        yield SimpleNamespace(register=register, resources=resources)
    resources.async_create_item.assert_not_called()
    resources.async_update_item.assert_not_called()


@pytest.fixture
async def navigation_entry(hass, navigation_environment):
    entry = MockConfigEntry(domain=DOMAIN, title="Liquid Glass Navigation", unique_id=DOMAIN, data={}, options={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    yield entry
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
