"""Validate the installable HACS integration without importing HA."""
import json
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPONENT = ROOT / 'custom_components' / 'liquid_glass_navigation'
manifest = json.loads((COMPONENT / 'manifest.json').read_text())
package = json.loads((ROOT / 'package.json').read_text())
version = package['version']
assert manifest['version'] == version
assert manifest['domain'] == 'liquid_glass_navigation'
assert manifest['config_flow'] is True
assert {'frontend', 'http', 'websocket_api'} <= set(manifest['dependencies'])
assert f"VERSION = '{version}'" in (ROOT / 'src/types.ts').read_text()
assert re.search(rf'VERSION\s*=\s*[\"\']{re.escape(version)}[\"\']', (COMPONENT / 'const.py').read_text())
assert json.loads((ROOT / 'hacs.json').read_text())['homeassistant'] == '2026.10.0'
assert (COMPONENT / 'www/liquid-glass-navigation.js').stat().st_size > 1000
icon = (COMPONENT / 'brand/icon.png').read_bytes()
assert icon[:8] == b'\x89PNG\r\n\x1a\n'
assert struct.unpack('>II', icon[16:24]) == (256, 256)
for path in COMPONENT.rglob('*.json'):
    json.loads(path.read_text())
assert json.loads((COMPONENT / 'strings.json').read_text()) == json.loads((COMPONENT / 'translations/en.json').read_text())
print(f'HACS integration package v{version} verified')
