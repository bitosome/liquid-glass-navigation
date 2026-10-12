/**
 * Cosmetic adapter for Home Assistant's native hui-root header.
 * Structure/parts verified against frontend hui-root, ha-tab-group and
 * ha-tab-group-tab (2026.10). Do not clone, reparent or hide native controls.
 * Every rule stops matching synchronously when HA enters its own edit mode.
 */
export const NAVIGATION_CSS = String.raw`
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) {
    --lgn-safe-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px));
    --lgn-safe-right: var(--safe-area-inset-right, env(safe-area-inset-right, 0px));
    --lgn-safe-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px));
    --lgn-safe-left: var(--safe-area-inset-left, env(safe-area-inset-left, 0px));
    --lgn-bar-width: min(
      calc(var(--lgn-width, 100vw) - var(--lgn-safe-left) - var(--lgn-safe-right) - 24px),
      760px
    );
    --lgn-glass: rgba(250, 251, 255, 0.76);
    --lgn-opaque: var(--card-background-color, #f9fafc);
    --lgn-rim: rgba(255, 255, 255, 0.8);
    --lgn-sheen: rgba(255, 255, 255, 0.42);
    --lgn-shadow: 0 10px 32px rgba(21, 29, 48, 0.16),
      0 2px 6px rgba(21, 29, 48, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
    --lgn-selected: color-mix(in srgb, var(--primary-color, #007aff) 12%, transparent);
    --lgn-selected-rim: color-mix(in srgb, var(--primary-color, #007aff) 14%, transparent);
    --lgn-hover: color-mix(in srgb, var(--primary-text-color, #1c1c1e) 6%, transparent);
  }

  :host([data-liquid-glass-navigation][data-liquid-glass-dark]) > div:not(.edit-mode) {
    --lgn-glass: rgba(29, 32, 40, 0.78);
    --lgn-opaque: var(--card-background-color, #20232b);
    --lgn-rim: rgba(255, 255, 255, 0.2);
    --lgn-sheen: rgba(255, 255, 255, 0.09);
    --lgn-shadow: 0 10px 36px rgba(0, 0, 0, 0.34),
      0 2px 8px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    --lgn-selected: color-mix(in srgb, var(--primary-color, #64a8ff) 22%, transparent);
    --lgn-selected-rim: color-mix(in srgb, var(--primary-color, #64a8ff) 26%, transparent);
    --lgn-hover: color-mix(in srgb, var(--primary-text-color, #f4f4f7) 9%, transparent);
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header {
    position: fixed;
    z-index: 4;
    top: auto;
    right: auto;
    bottom: calc(var(--lgn-safe-bottom) + 12px);
    left: calc(
      var(--lgn-left, 0px) + var(--lgn-safe-left) +
      (var(--lgn-width, 100vw) - var(--lgn-safe-left) - var(--lgn-safe-right) - var(--lgn-bar-width)) / 2
    );
    width: var(--lgn-bar-width);
    max-width: none;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    border: 1px solid var(--lgn-rim);
    border-radius: 34px;
    color: var(--primary-text-color, #1c1c1e);
    background: transparent;
    box-shadow: var(--lgn-shadow);
    overflow: visible;
    /* A filtered header would change fixed positioning for native popups. */
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    transform: none;
  }

  /* The controller sets this only for an editable focus and a visible keyboard. */
  :host([data-liquid-glass-navigation][data-liquid-glass-keyboard]) > div:not(.edit-mode) > .header {
    visibility: hidden;
    pointer-events: none;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    border-radius: inherit;
    background-color: var(--lgn-glass);
    background-image: linear-gradient(155deg, var(--lgn-sheen), transparent 44%, transparent 72%, var(--lgn-sheen));
    -webkit-backdrop-filter: blur(26px) saturate(175%);
    backdrop-filter: blur(26px) saturate(175%);
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header .toolbar {
    box-sizing: border-box;
    width: 100%;
    height: 64px;
    min-height: 64px;
    margin: 0;
    padding: 6px;
    gap: 2px;
    border: 0;
    color: inherit;
    background: transparent;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header .main-title {
    margin-inline-start: 8px;
    margin-inline-end: 8px;
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header .action-items {
    flex: 0 0 auto;
    gap: 2px;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-menu-button,
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-icon-button,
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-icon-button-arrow-prev {
    --ha-icon-button-size: 44px;
    --mdc-icon-button-size: 44px;
    --ha-icon-button-color: var(--primary-text-color, #1c1c1e);
    --mdc-theme-on-primary: var(--primary-text-color, #1c1c1e);
    flex-shrink: 0;
    color: inherit;
  }

  /* The menu host renders nothing when HA hides its native sidebar button. */
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-icon-button,
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-icon-button-arrow-prev {
    width: 44px;
    min-width: 44px;
    height: 44px;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group {
    --ha-tab-indicator-color: transparent;
    --ha-tab-track-color: transparent;
    --ha-tab-active-text-color: var(--primary-color, #007aff);
    --track-width: 0px;
    --safe-track-width: 0px;
    flex: 1 1 auto;
    min-width: 0;
    height: 52px;
    align-self: center;
    color: var(--primary-text-color, #1c1c1e);
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(base) {
    height: 52px;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(nav) {
    display: flex;
    min-width: 0;
    min-height: 52px;
    padding: 0;
    border: 0;
    align-items: center;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(tabs) {
    gap: 4px;
    align-items: center;
    min-height: 52px;
    padding: 0;
  }

  /* Native arrows remain conditional and clickable, but consume layout space
     instead of covering edge tabs. The inner overflow-auto nav flexes between
     them. HA ties the plain-button quiet colour to the underline, which is
     transparent here; override that token at the button, not just host color. */
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(scroll-button) {
    --wa-color-neutral-on-quiet: var(--primary-text-color, #1c1c1e);
    --wa-color-on-quiet: var(--primary-text-color, #1c1c1e);
    position: static;
    flex: 0 0 44px;
    width: 44px;
    min-width: 44px;
    height: 48px;
    margin: 0;
    padding: 0;
    inset: auto;
    border-radius: 24px;
    color: var(--primary-text-color, #1c1c1e);
    background: transparent;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(scroll-button__base) {
    box-sizing: border-box;
    width: 44px;
    min-width: 44px;
    height: 48px;
    min-height: 48px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 24px;
    color: var(--primary-text-color, #1c1c1e);
    background: transparent;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab {
    --ha-tab-group-tab-height: 48px;
    --ha-tab-padding-start: 14px;
    --ha-tab-padding-end: 14px;
    flex: 0 0 auto;
    height: 48px;
    min-width: 48px;
    color: var(--primary-text-color, #1c1c1e);
    opacity: 1;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab::part(base) {
    box-sizing: border-box;
    height: 48px;
    min-width: 48px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 24px;
    font: inherit;
    line-height: 1.25;
    color: inherit;
    background: transparent;
    transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab.icon-only::part(base) {
    padding: 0 11px;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab[active]:not([disabled]),
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab[aria-selected="true"]:not([disabled]) {
    color: var(--primary-color, #007aff);
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab[active]:not([disabled])::part(base),
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab[aria-selected="true"]:not([disabled])::part(base) {
    background: var(--lgn-selected);
    border-color: var(--lgn-selected-rim);
    font-weight: var(--ha-font-weight-medium, 500);
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab:focus-visible::part(base) {
    outline: 2px solid var(--primary-color, #007aff);
    outline-offset: -3px;
  }

  @media (hover: hover) {
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab:not([active]):not([aria-selected="true"]):not([disabled])::part(base):hover {
      background: var(--lgn-hover);
    }
  }

  /* Keep HA's top inset and user spacing; replace only the header reservation. */
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > hui-view-container {
    padding-top: calc(var(--lgn-safe-top) + var(--view-container-padding-top, 0px));
    padding-bottom: calc(
      var(--lgn-height, 64px) + var(--lgn-safe-bottom) + 24px +
      var(--view-container-padding-bottom, 0px)
    );
    scroll-padding-bottom: calc(var(--lgn-height, 64px) + var(--lgn-safe-bottom) + 24px);
  }

  :host([data-liquid-glass-navigation][data-liquid-glass-opaque]) > div:not(.edit-mode) > .header::before {
    background: var(--lgn-opaque);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header::before {
      background: var(--lgn-opaque);
    }
  }

  @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header::before {
      background: var(--lgn-opaque);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header {
      border-color: var(--divider-color, currentColor);
    }
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab[active]:not([disabled])::part(base),
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab[aria-selected="true"]:not([disabled])::part(base) {
      border-color: currentColor;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab::part(base) {
      transition: none;
      animation: none;
    }
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(nav) {
      scroll-behavior: auto;
    }
  }

  @media (forced-colors: active) {
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header {
      border-color: CanvasText;
      color: CanvasText;
      box-shadow: none;
    }
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header::before {
      background: Canvas;
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(scroll-button) {
      --wa-color-neutral-on-quiet: ButtonText;
      --wa-color-on-quiet: ButtonText;
      color: ButtonText;
      background: ButtonFace;
    }
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(scroll-button__base) {
      color: ButtonText;
      background: ButtonFace;
    }
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab[active]:not([disabled])::part(base),
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab[aria-selected="true"]:not([disabled])::part(base) {
      color: HighlightText;
      background: Highlight;
      border-color: Highlight;
      forced-color-adjust: none;
    }
  }
`;
