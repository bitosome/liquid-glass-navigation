"""Constants and the shared, non-secret frontend configuration."""
from collections.abc import Mapping
from typing import Any

DOMAIN = "liquid_glass_navigation"
VERSION = "0.1.2"
TITLE = "Liquid Glass Navigation"
# Give each release a new path, including through caches that ignore query strings.
MODULE_PATH = f"/{DOMAIN}/{VERSION}/liquid-glass-navigation.js"
MODULE_URL = MODULE_PATH
SUBSCRIBE = f"{DOMAIN}/subscribe"
SCOPES = ("mobile", "all")
DEFAULT_OPTIONS = {"enabled": True, "scope": "mobile", "reduce_transparency": False}


def normalize_options(options: Mapping[str, Any]) -> dict[str, Any]:
    """Keep malformed or older stored options from breaking stock navigation."""
    return {
        "enabled": options.get("enabled", True) is True,
        "scope": options.get("scope") if options.get("scope") in SCOPES else "mobile",
        "reduce_transparency": options.get("reduce_transparency", False) is True,
    }
