"""Exercise the packaged module through Home Assistant's real static handler."""
from pathlib import Path
from urllib.parse import urlsplit

from homeassistant.components import frontend
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry, mock_component

from custom_components.liquid_glass_navigation.const import DOMAIN, MODULE_URL, VERSION


async def test_bundled_module_is_served_and_native_extra_module_manager_is_reversible(
    hass, enable_custom_integrations, hass_client_no_auth
):
    # Exercise HA 2026.10's actual UrlManager and HTTP route. Only the frontend
    # shell dependency is omitted; no static registration or file read is mocked.
    mock_component(hass, "frontend")
    changes = []
    urls = frontend.UrlManager(lambda kind, url: changes.append((kind, url)), ["/unrelated-module.js"])
    hass.data[frontend.DATA_EXTRA_MODULE_URL] = urls
    assert await async_setup_component(hass, "websocket_api", {})
    entry = MockConfigEntry(domain=DOMAIN, title="Liquid Glass Navigation", unique_id=DOMAIN, data={}, options={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    # Updating a release must change the cache key even without query strings.
    assert VERSION in urlsplit(MODULE_URL).path.split("/")
    assert not urlsplit(MODULE_URL).query
    assert changes == [("added", MODULE_URL)]
    assert urls.urls == frozenset({"/unrelated-module.js", MODULE_URL})
    bundle = Path(__file__).parents[1] / "custom_components" / DOMAIN / "www" / "liquid-glass-navigation.js"
    expected = await hass.async_add_executor_job(bundle.read_bytes)
    assert expected, "Build the frontend before backend package smoke tests"
    client = await hass_client_no_auth()
    response = await client.get(MODULE_URL)
    assert response.status == 200
    assert response.content_type in {"application/javascript", "text/javascript"}
    assert await response.read() == expected
    assert await hass.config_entries.async_unload(entry.entry_id)
    assert changes == [("added", MODULE_URL), ("removed", MODULE_URL)]
    assert urls.urls == frozenset({"/unrelated-module.js"})
