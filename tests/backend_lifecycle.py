"""Lifecycle invariants: reversible loading, broadcast updates, no dashboard writes."""
import asyncio
from unittest.mock import Mock

import pytest
from homeassistant.components import frontend
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.liquid_glass_navigation import (
    async_setup, async_setup_entry, async_unload_entry, async_update_options,
)
from custom_components.liquid_glass_navigation.const import DOMAIN, MODULE_PATH, MODULE_URL, VERSION


def test_options_are_safe_and_have_only_public_fields(hass):
    from custom_components.liquid_glass_navigation import NavigationRuntime
    from custom_components.liquid_glass_navigation.const import normalize_options
    assert normalize_options({"enabled": "false", "scope": "unknown", "reduce_transparency": "no"}) == {
        "enabled": False, "scope": "mobile", "reduce_transparency": False,
    }
    assert NavigationRuntime(hass).config == {
        "enabled": False, "scope": "mobile", "reduce_transparency": False, "version": VERSION,
    }


async def test_static_route_registered_once_and_only_owned_module_removed(hass, navigation_environment, navigation_entry):
    runtime = hass.data[DOMAIN]
    assert runtime.config["enabled"] is True
    assert MODULE_URL in hass.data[frontend.DATA_EXTRA_MODULE_URL]
    paths = navigation_environment.register.call_args.args[0]
    assert len(paths) == 1
    assert paths[0].url_path == MODULE_PATH
    assert paths[0].cache_headers is False
    assert await async_setup(hass, {})
    await asyncio.gather(async_setup(hass, {}), async_setup(hass, {}))
    assert await hass.config_entries.async_reload(navigation_entry.entry_id)
    navigation_environment.register.assert_awaited_once()
    assert len(navigation_entry.update_listeners) == 1
    assert await hass.config_entries.async_unload(navigation_entry.entry_id)
    assert hass.data[frontend.DATA_EXTRA_MODULE_URL] == {"/unrelated-module.js"}
    assert runtime.config["enabled"] is False


async def test_unload_broadcast_precedes_module_removal_and_reload_notifies(hass, navigation_entry):
    runtime = hass.data[DOMAIN]
    received = []
    unsubscribe = runtime.subscribe(lambda config: received.append((config, MODULE_URL in hass.data[frontend.DATA_EXTRA_MODULE_URL])))
    assert await hass.config_entries.async_unload(navigation_entry.entry_id)
    assert received[-1][0]["enabled"] is False
    assert received[-1][1] is True
    assert MODULE_URL not in hass.data[frontend.DATA_EXTRA_MODULE_URL]
    assert await hass.config_entries.async_setup(navigation_entry.entry_id)
    assert received[-1][0]["enabled"] is True
    assert received[-1][1] is True
    unsubscribe()
    unsubscribe()
    assert not runtime.listeners


async def test_options_broadcast_without_reload_and_persist_across_reload(hass, navigation_entry):
    runtime = hass.data[DOMAIN]
    received = []
    unsubscribe = runtime.subscribe(received.append)
    options = {"enabled": True, "scope": "all", "reduce_transparency": True}
    hass.config_entries.async_update_entry(navigation_entry, options=options)
    await hass.async_block_till_done()
    assert received[-1] == {**options, "version": VERSION}
    assert runtime.active_entry is navigation_entry
    assert await hass.config_entries.async_reload(navigation_entry.entry_id)
    assert runtime.config == {**options, "version": VERSION}
    assert navigation_entry.options == options
    unsubscribe()


async def test_disabled_option_restores_then_can_enable_open_client(hass, navigation_entry):
    runtime = hass.data[DOMAIN]
    received = []
    runtime.subscribe(received.append)
    hass.config_entries.async_update_entry(navigation_entry, options={"enabled": False})
    await hass.async_block_till_done()
    assert received[-1]["enabled"] is False
    # Keep the module autoloaded while the entry is installed, so clients opened
    # while disabled also receive a later enable without a dashboard reload.
    assert MODULE_URL in hass.data[frontend.DATA_EXTRA_MODULE_URL]
    hass.config_entries.async_update_entry(navigation_entry, options={"enabled": True})
    await hass.async_block_till_done()
    assert received[-1]["enabled"] is True


async def test_stale_options_callback_cannot_enable_unloaded_entry(hass, navigation_entry):
    runtime = hass.data[DOMAIN]
    assert await hass.config_entries.async_unload(navigation_entry.entry_id)
    await async_update_options(hass, navigation_entry)
    assert runtime.config["enabled"] is False
    assert MODULE_URL not in hass.data[frontend.DATA_EXTRA_MODULE_URL]
    assert not navigation_entry.update_listeners


async def test_broken_subscriber_does_not_stop_other_clients_restoring(hass, navigation_entry):
    runtime = hass.data[DOMAIN]
    broken = Mock(side_effect=RuntimeError("closed"))
    healthy = Mock()
    runtime.subscribe(broken)
    runtime.subscribe(healthy)
    await async_unload_entry(hass, navigation_entry)
    healthy.assert_called_once()
    assert healthy.call_args.args[0]["enabled"] is False
    assert broken not in runtime.listeners


async def test_duplicate_entry_cannot_replace_active_owner(hass, navigation_entry):
    duplicate = MockConfigEntry(domain=DOMAIN, title="Duplicate", data={}, options={"scope": "all"})
    duplicate.add_to_hass(hass)
    assert not await async_setup_entry(hass, duplicate)
    assert await async_unload_entry(hass, duplicate)
    assert hass.data[DOMAIN].active_entry is navigation_entry
    assert hass.data[DOMAIN].config["scope"] == "mobile"
    assert MODULE_URL in hass.data[frontend.DATA_EXTRA_MODULE_URL]


async def test_registration_failure_can_retry_without_half_loaded_module(hass, navigation_environment):
    navigation_environment.register.side_effect = [RuntimeError("temporary"), None]
    with pytest.raises(RuntimeError, match="temporary"):
        await async_setup(hass, {})
    assert not hass.data[DOMAIN].initialized
    assert MODULE_URL not in hass.data[frontend.DATA_EXTRA_MODULE_URL]
    assert await async_setup(hass, {})
    assert hass.data[DOMAIN].initialized
    assert navigation_environment.register.await_count == 2


async def test_concurrent_initialization_registers_one_static_route(hass, navigation_environment):
    async def register(_paths):
        await asyncio.sleep(0)
    navigation_environment.register.side_effect = register
    assert await asyncio.gather(async_setup(hass, {}), async_setup(hass, {})) == [True, True]
    navigation_environment.register.assert_awaited_once()
    assert hass.data[DOMAIN].initialized
