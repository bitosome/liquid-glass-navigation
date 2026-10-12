"""Native Home Assistant setup and shared navigation options."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import DOMAIN, SCOPES, TITLE, normalize_options


def options_schema(options: dict[str, Any]) -> vol.Schema:
    defaults = normalize_options(options)
    return vol.Schema({
        vol.Required("enabled", default=defaults["enabled"]): bool,
        vol.Required("scope", default=defaults["scope"]): selector.SelectSelector(
            selector.SelectSelectorConfig(options=list(SCOPES), translation_key="scope")
        ),
        vol.Required("reduce_transparency", default=defaults["reduce_transparency"]): bool,
    })


class LiquidGlassNavigationConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Configure a single shared navigation extension."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        self._async_abort_entries_match()
        if user_input is not None:
            return self.async_create_entry(
                title=TITLE, data={}, options=normalize_options(user_input)
            )
        return self.async_show_form(step_id="user", data_schema=options_schema({}))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: config_entries.ConfigEntry):
        return LiquidGlassNavigationOptionsFlow()


class LiquidGlassNavigationOptionsFlow(config_entries.OptionsFlow):
    """Persist shared options and notify open browsers immediately."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        if user_input is not None:
            return self.async_create_entry(data=normalize_options(user_input))
        return self.async_show_form(
            step_id="init", data_schema=options_schema(dict(self.config_entry.options))
        )
