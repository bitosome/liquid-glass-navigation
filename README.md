# Liquid Glass Navigation

A floating bottom bar for Home Assistant, using **the actual native dashboard toolbar and view tabs**. Its translucent capsule, soft blur, rim highlights and selected pill bring a Liquid Glass-inspired treatment to the navigation layer.

This is a **HACS integration with a bundled frontend extension**, not a card you add to dashboards.

## What stays native

- Dashboard views, their order, icons, names and per-user visibility.
- View navigation, browser history, modified clicks, keyboard navigation and horizontal tab scrolling. Swipe or drag through tabs; arrow buttons are omitted to give the views more space.
- Sidebar menu, subview Back button, search/Assist and the native overflow menu.
- Adding, editing and rearranging views through Home Assistant's **Edit dashboard** interface.

Opening the temporary sidebar contracts the bar into a glass menu circle beside the drawer. Tap it to close the sidebar and expand the bar again. The close circle belongs to the native modal drawer, so its focus, backdrop, Escape and swipe dismissal stay intact. Permanently docked sidebars keep the full bar.

No second tab configuration, copied tab list, dashboard writes or replacement editor. Entering edit mode restores the standard top toolbar so Home Assistant's existing add/edit/move controls work as usual. Leaving edit mode restores the floating bar.

## Install

1. In HACS, add `https://github.com/bitosome/liquid-glass-navigation` as a custom **Integration** repository.
2. Download Liquid Glass Navigation and restart Home Assistant once to discover the new integration.
3. Go to **Settings → Devices & services → Add integration → Liquid Glass Navigation**.
4. Keep **Enabled** on and choose **Mobile screens only** or **All screens**.
5. Refresh the dashboard. Do not add a Lovelace card or a dashboard resource.

The default mobile scope is a viewport up to 767 CSS pixels wide. All-screen mode centers the bar within the dashboard content, respecting the sidebar. Nine or more views remain horizontally scrollable; they are never squeezed into tiny buttons.

## Updating

Each deployed update must use a new version across the integration, package and frontend. The module URL includes that version in its path, so browser/proxy caches request a new asset and the frontend replaces an older running controller. After updating the integration files, restart Home Assistant to load the new Python code and module route, then reload the dashboard. Reloading the config entry alone does not load updated Python modules. Do not overwrite a deployed build under the same version.

## Settings and recovery

Use the integration's native **Configure** dialog:

| Option | Behavior |
| --- | --- |
| Enabled | Turn the floating treatment on/off for everyone. Open clients restore the original bar when disabled. |
| Scope | Phones/narrow windows, or all screen sizes. |
| Reduce transparency | Use an opaque theme-aware surface. |

Settings live in Home Assistant's config entry, survive restarts and are shared by all users. View visibility still follows each user's native Home Assistant configuration. Non-admin users can receive the presentation settings but cannot change integration options.

For a client-only escape, append `?liquid_glass=off` to the dashboard URL (or `&liquid_glass=off` when it already has a query). This restores the native header while that query is present. Disabling or removing the integration also restores stock navigation; it never needs to restore a modified dashboard because it does not modify one.

## Compatibility

- Minimum Home Assistant **2026.10.0**. The native adapter is verified against frontend **20260930.2**, pinned by that Core release.
- Normal Lovelace views, single-view dashboards and subviews retain their existing controls. Other Home Assistant panels are untouched.
- Native edit mode, custom slotted toolbars, unknown header structure, and sections with their own bottom sidebar switcher retain the standard top bar.
- Safe-area spacing keeps the bar above the phone home indicator and reserves room at the end of dashboard content. Text-entry keyboards temporarily hide the floating bar.
- Light/dark themes, keyboard focus, reduced motion, reduced transparency, higher contrast and forced colors are supported. Unsupported blur falls back to an opaque surface.
- The drawer circle requires the native modal drawer structure and browser Popover API, with enough room for a 44px minimum target beside the sidebar. Unknown layouts or very narrow remaining space retain native drawer dismissal.
- Header replacement/kiosk extensions may conflict. Use one owner for the header; unsupported structures are left unchanged.

This is a web implementation inspired by Apple's Liquid Glass guidance, not an Apple system material. Home Assistant does not provide a stable public API for repositioning its toolbar, so this project uses a narrow, reversible adapter for verified native DOM structure. It does not patch native render methods, reparent Lit-managed nodes, or intercept navigation handlers. Recheck compatibility after frontend upgrades.

## Development

```sh
npm ci
npm run check
python3.14 -m venv .venv
.venv/bin/pip install -r requirements-test.txt
.venv/bin/pytest -q
python3 scripts/check_package.py
python3 scripts/package.py
```

The built frontend is committed at `custom_components/liquid_glass_navigation/www/liquid-glass-navigation.js`, so HACS's standard integration download includes it. Release CI rebuilds and checks for drift before creating the installable ZIP.

| Source | Responsibility |
| --- | --- |
| `custom_components/liquid_glass_navigation/` | Native config/options, static module registration and read-only live configuration subscription |
| `src/controller.ts` | HA shell discovery, subscription/reconnect lifecycle and cleanup |
| `src/adapter.ts` | Compatibility checks, measured geometry and reversible styling |
| `src/styles.ts` | Floating glass treatment and accessibility fallbacks |
| `src/drawer.ts` | Native drawer observation and the temporary modal close circle |
| `tests/` | Synthetic DOM regression cases and actual Home Assistant backend tests |

The project icon source is `branding/icon.svg`; the installable 256px PNG lives in the integration’s `brand/` directory.

Public fixtures contain no household configuration or credentials. Tests never operate devices. Browser rendering and real iOS/Android interaction are separate acceptance checks; passing DOM tests does not establish visual fidelity.

## References

- [Home Assistant native toolbar](https://github.com/home-assistant/frontend/blob/20260930.2/src/panels/lovelace/hui-root.ts)
- [Native tab group](https://github.com/home-assistant/frontend/blob/20260930.2/src/components/ha-tab-group.ts)
- [Frontend module registration](https://github.com/home-assistant/core/blob/2026.10.0/homeassistant/components/frontend/__init__.py)
- [Apple materials guidance](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Apple tab-bar guidance](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
