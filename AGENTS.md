# Liquid Glass Navigation

Owns a HACS integration and its bundled frontend extension. This is not a Lovelace card: it repositions the actual Home Assistant dashboard header.

- Preserve native view configuration, order, visibility, icons, labels, navigation events, menu/back/overflow controls and editing. Never create a second tab list, copy/reparent native elements, patch native component render methods, or save dashboard configuration. The owner requests swipe-only tabs (native scroll controls disabled reversibly) and a collapsed menu circle while the temporary sidebar is open. The circle is an owned accessory inside the existing modal dialog; preserve native modality, focus and dismissal.
- Apply only to a verified compatible Lovelace header. Unknown structure, disabled integration, native edit mode or explicit escape must leave stock navigation available. Remove only owned styles/attributes on cleanup.
- Integration options are shared and persistent; open clients restore stock immediately on disable/unload. No browser storage as authority.
- HACS category Integration. Build the frontend into custom_components/liquid_glass_navigation/www. Keep config/backend, adapter/layout, styling and tests separate.
- Glass belongs only to the navigation layer. Retain HA theme typography/icons, 44px minimum targets, safe-area spacing, readable light/dark/opaque fallbacks, reduced motion/contrast/transparency behavior.
- Public fixtures only. Never commit household dashboard data, images, credentials or auth stores. No physical-device operations. Do not deploy to live HA without authorization for this project.
- Run frontend typecheck/build/tests, actual HA backend tests and package checks before release. Keep Python manifest/package/bundle versions aligned.
