"""Real authenticated websocket subscriptions and native options permission gates."""
from homeassistant.components import frontend
from homeassistant.components.config import config_entries as config_views

from custom_components.liquid_glass_navigation.const import DOMAIN, MODULE_URL, SUBSCRIBE, VERSION


async def subscribe(client):
    await client.send_json({"id": 1, "type": SUBSCRIBE})
    assert await client.receive_json() == {"id": 1, "type": "result", "success": True, "result": None}
    return (await client.receive_json())["event"]


async def test_initial_update_unload_reload_and_unsubscribe(hass, navigation_entry, hass_ws_client):
    client = await hass_ws_client(hass)
    initial = await subscribe(client)
    assert initial == {"enabled": True, "scope": "mobile", "reduce_transparency": False, "version": VERSION}
    hass.config_entries.async_update_entry(navigation_entry, options={"scope": "all"})
    await hass.async_block_till_done()
    assert (await client.receive_json())["event"]["scope"] == "all"
    await hass.config_entries.async_unload(navigation_entry.entry_id)
    assert (await client.receive_json())["event"]["enabled"] is False
    assert MODULE_URL not in hass.data[frontend.DATA_EXTRA_MODULE_URL]
    await hass.config_entries.async_setup(navigation_entry.entry_id)
    assert (await client.receive_json())["event"]["enabled"] is True
    await client.send_json({"id": 2, "type": "unsubscribe_events", "subscription": 1})
    assert (await client.receive_json())["success"] is True
    assert not hass.data[DOMAIN].listeners


async def test_read_only_user_can_subscribe_but_cannot_change_options(hass, navigation_entry, hass_ws_client, hass_read_only_user, hass_client):
    config_views.async_setup(hass)
    token = await hass.auth.async_create_refresh_token(hass_read_only_user, "http://example.test")
    access_token = hass.auth.async_create_access_token(token)
    client = await hass_ws_client(hass, access_token=access_token)
    assert (await subscribe(client))["enabled"] is True
    http_client = await hass_client(access_token=access_token)
    response = await http_client.post("/api/config/config_entries/options/flow", json={"handler": navigation_entry.entry_id})
    assert response.status == 401  # Native require_admin raises HA Unauthorized.
    assert dict(navigation_entry.options) == {}


async def test_disconnect_cleans_subscription(hass, navigation_entry, hass_ws_client):
    client = await hass_ws_client(hass)
    await subscribe(client)
    assert len(hass.data[DOMAIN].listeners) == 1
    await client.close()
    await hass.async_block_till_done()
    assert not hass.data[DOMAIN].listeners


async def test_subscribing_while_unloaded_receives_disabled(hass, navigation_entry, hass_ws_client):
    await hass.config_entries.async_unload(navigation_entry.entry_id)
    client = await hass_ws_client(hass)
    assert (await subscribe(client))["enabled"] is False


async def test_multiple_clients_share_identical_settings(hass, navigation_entry, hass_ws_client):
    first = await hass_ws_client(hass)
    second = await hass_ws_client(hass)
    assert await subscribe(first) == await subscribe(second)
    hass.config_entries.async_update_entry(navigation_entry, options={"enabled": False, "scope": "all", "reduce_transparency": True})
    await hass.async_block_till_done()
    one, two = (await first.receive_json())["event"], (await second.receive_json())["event"]
    assert one == two == {"enabled": False, "scope": "all", "reduce_transparency": True, "version": VERSION}


async def test_unauthenticated_socket_cannot_subscribe(hass, navigation_entry, hass_client_no_auth):
    client = await hass_client_no_auth()
    socket = await client.ws_connect("/api/websocket")
    assert (await socket.receive_json())["type"] == "auth_required"
    await socket.send_json({"type": "auth", "access_token": "invalid-test-token"})
    assert (await socket.receive_json())["type"] == "auth_invalid"
    assert not hass.data[DOMAIN].listeners
