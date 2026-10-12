"""Native setup/options retain one shared configuration with validated inputs."""
import pytest
import voluptuous as vol
from homeassistant.config_entries import SOURCE_USER

from custom_components.liquid_glass_navigation.const import DOMAIN, VERSION


async def test_native_setup_defaults_and_single_instance(hass, navigation_environment):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] == "form"
    assert result["data_schema"]({}) == {"enabled": True, "scope": "mobile", "reduce_transparency": False}
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"enabled": True, "scope": "mobile", "reduce_transparency": False})
    assert result["type"] == "create_entry"
    assert result["data"] == {}
    assert result["options"]["enabled"] is True
    await hass.async_block_till_done()
    entry = result["result"]
    assert entry.unique_id == DOMAIN
    assert hass.data[DOMAIN].config == {**dict(entry.options), "version": VERSION}
    duplicate = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert duplicate["type"] == "abort"
    assert duplicate["reason"] == "single_instance_allowed"
    await hass.config_entries.async_unload(entry.entry_id)


async def test_options_form_updates_shared_state_and_retains_defaults(hass, navigation_entry):
    result = await hass.config_entries.options.async_init(navigation_entry.entry_id)
    assert result["type"] == "form"
    options = {"enabled": False, "scope": "all", "reduce_transparency": True}
    saved = await hass.config_entries.options.async_configure(result["flow_id"], options)
    assert saved["type"] == "create_entry"
    await hass.async_block_till_done()
    assert dict(navigation_entry.options) == options
    assert hass.data[DOMAIN].config == {**options, "version": VERSION}
    reopened = await hass.config_entries.options.async_init(navigation_entry.entry_id)
    assert reopened["data_schema"]({}) == options
    hass.config_entries.options.async_abort(reopened["flow_id"])


async def test_options_schema_rejects_unknown_scope_and_text_booleans(hass, navigation_entry):
    result = await hass.config_entries.options.async_init(navigation_entry.entry_id)
    schema = result["data_schema"]
    with pytest.raises(vol.Invalid):
        schema({"scope": "custom"})
    with pytest.raises(vol.Invalid):
        schema({"enabled": "true"})
    with pytest.raises(vol.Invalid):
        schema({"secret": "not allowed"})
    hass.config_entries.options.async_abort(result["flow_id"])


async def test_options_reach_native_persistent_config_entry_storage(hass, navigation_entry, hass_storage, freezer):
    from datetime import timedelta
    from homeassistant.util import dt as dt_util
    from pytest_homeassistant_custom_component.common import async_fire_time_changed
    options = {"enabled": True, "scope": "all", "reduce_transparency": True}
    result = await hass.config_entries.options.async_init(navigation_entry.entry_id)
    await hass.config_entries.options.async_configure(result["flow_id"], options)
    await hass.async_block_till_done()
    freezer.tick(timedelta(seconds=2))
    async_fire_time_changed(hass, dt_util.utcnow())
    await hass.async_block_till_done()
    stored = hass_storage["core.config_entries"]["data"]["entries"]
    entry = next(item for item in stored if item["entry_id"] == navigation_entry.entry_id)
    assert entry["options"] == options
    assert entry["data"] == {}
