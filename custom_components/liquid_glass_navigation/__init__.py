"""Load a reversible native-dashboard navigation extension for every client."""
from __future__ import annotations

import asyncio
from collections.abc import Callable
import logging
from pathlib import Path
from typing import Any

import voluptuous as vol

from homeassistant.components import frontend, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN, MODULE_PATH, MODULE_URL, SUBSCRIBE, VERSION, normalize_options

_LOGGER = logging.getLogger(__name__)
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


class NavigationRuntime:
    """One server-lifetime subscription hub, retained across entry reloads.

    Config entries own persistence. This hub publishes only public presentation
    options; it never reads or modifies dashboard configuration or resources.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.active_entry: ConfigEntry | None = None
        self.options = normalize_options({})
        self.listeners: set[Callable[[dict[str, Any]], None]] = set()
        self.initialized = False
        self.module_loaded = False
        self._initialize_lock = asyncio.Lock()

    @property
    def config(self) -> dict[str, Any]:
        return {
            **self.options,
            "enabled": self.active_entry is not None and self.options["enabled"],
            "version": VERSION,
        }

    async def async_initialize(self) -> None:
        """Register the HTTP route and read-only websocket command exactly once."""
        async with self._initialize_lock:
            if self.initialized:
                return
            await self.hass.http.async_register_static_paths([
                StaticPathConfig(
                    MODULE_PATH,
                    str(Path(__file__).parent / "www" / "liquid-glass-navigation.js"),
                    False,
                )
            ])
            websocket_api.async_register_command(self.hass, websocket_subscribe)
            self.initialized = True

    @callback
    def activate(self, entry: ConfigEntry) -> bool:
        if self.active_entry is not None and self.active_entry is not entry:
            _LOGGER.error("Only one Liquid Glass Navigation entry may be loaded")
            return False
        self.active_entry = entry
        self.options = normalize_options(entry.options)
        if not self.module_loaded:
            frontend.add_extra_js_url(self.hass, MODULE_URL)
            self.module_loaded = True
        self.publish()
        return True

    @callback
    def deactivate(self, entry: ConfigEntry) -> None:
        if self.active_entry is not entry:
            return
        self.active_entry = None
        # Loaded browsers must restore stock navigation before future clients
        # stop loading the module. Keep subscriptions alive for entry reload.
        self.publish()
        if self.module_loaded:
            try:
                frontend.remove_extra_js_url(self.hass, MODULE_URL)
            except KeyError:
                # Another cleanup may already have removed our exact URL.
                pass
            self.module_loaded = False

    @callback
    def update(self, entry: ConfigEntry) -> None:
        # An options-listener task queued before unload must not reactivate it.
        if self.active_entry is entry:
            self.options = normalize_options(entry.options)
            self.publish()

    @callback
    def subscribe(self, listener: Callable[[dict[str, Any]], None]) -> Callable[[], None]:
        self.listeners.add(listener)

        @callback
        def unsubscribe() -> None:
            self.listeners.discard(listener)

        return unsubscribe

    @callback
    def publish(self) -> None:
        for listener in tuple(self.listeners):
            try:
                listener(self.config)
            except Exception:
                # A closed client must not stop restoration for other clients.
                self.listeners.discard(listener)
                _LOGGER.debug("Removed unavailable navigation subscriber", exc_info=True)


@callback
def _runtime(hass: HomeAssistant) -> NavigationRuntime:
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = NavigationRuntime(hass)
    return hass.data[DOMAIN]


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    await _runtime(hass).async_initialize()
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    runtime = _runtime(hass)
    await runtime.async_initialize()
    if not runtime.activate(entry):
        return False
    entry.async_on_unload(entry.add_update_listener(async_update_options))
    return True


async def async_update_options(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Publish persisted options without reloading the module or dashboards."""
    _runtime(hass).update(entry)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    _runtime(hass).deactivate(entry)
    return True


@callback
@websocket_api.websocket_command({vol.Required("type"): SUBSCRIBE})
def websocket_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Send configuration to any authenticated client, including read-only users.

    Home Assistant authenticates the websocket before dispatch. There is no
    websocket mutation command; only administrators can change config options
    through Home Assistant's native integration settings.
    """
    runtime = _runtime(hass)

    @callback
    def send_config(config: dict[str, Any]) -> None:
        connection.send_event(msg["id"], config)

    connection.subscriptions[msg["id"]] = runtime.subscribe(send_config)
    connection.send_result(msg["id"])
    send_config(runtime.config)
