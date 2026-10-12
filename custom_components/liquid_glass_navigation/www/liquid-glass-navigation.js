const e=String.raw`
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) {
    --lgn-empty-sections-top: 8px;
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
    height: 66px;
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
    opacity: 1;
    transition:
      opacity 140ms ease,
      left 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
      width 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
      height 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
      border-radius 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  /* The same native header contracts behind the modal drawer. Its interactive
     close accessory is owned by the drawer adapter inside the modal scope. */
  :host([data-liquid-glass-navigation][data-liquid-glass-collapsed]) > div:not(.edit-mode) > .header {
    left: var(--lgn-collapse-left, var(--lgn-left, 0px));
    width: var(--lgn-collapse-size, 64px);
    height: var(--lgn-collapse-size, 64px);
    border-radius: calc(var(--lgn-collapse-size, 64px) / 2);
    /* Only the modal accessory paints here; avoid doubled glass and shadows. */
    opacity: 0;
    pointer-events: none;
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
    transition: height 240ms ease, min-height 240ms ease, padding 240ms ease;
  }

  :host([data-liquid-glass-navigation][data-liquid-glass-collapsed]) > div:not(.edit-mode) > .header .toolbar {
    height: calc(var(--lgn-collapse-size, 64px) - 2px);
    min-height: calc(var(--lgn-collapse-size, 64px) - 2px);
    padding: calc((var(--lgn-collapse-size, 64px) - 46px) / 2);
    gap: 0;
    justify-content: center;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group,
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header .action-items,
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header .main-title {
    opacity: 1;
    visibility: visible;
    transition: opacity 120ms ease 90ms;
  }

  /* Hidden controls cannot receive focus or spill outside the shrinking shell.
     On expansion they fade back after the capsule has room for its contents. */
  :host([data-liquid-glass-navigation][data-liquid-glass-collapsed]) > div:not(.edit-mode) > .header ha-tab-group,
  :host([data-liquid-glass-navigation][data-liquid-glass-collapsed]) > div:not(.edit-mode) > .header .action-items,
  :host([data-liquid-glass-navigation][data-liquid-glass-collapsed]) > div:not(.edit-mode) > .header .main-title {
    flex: 0 0 0;
    width: 0;
    min-width: 0;
    max-width: 0;
    margin: 0;
    overflow: hidden;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: none;
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
    /* Fade the fixed viewport, not the moving tabs or the menu buttons.
       A mask lets the actual glass show through without an opaque overlay. */
    -webkit-mask-image: linear-gradient(to right,
      transparent, rgba(0, 0, 0, 0.2) 3px, rgba(0, 0, 0, 0.75) 9px, #000 14px,
      #000 calc(100% - 14px), rgba(0, 0, 0, 0.75) calc(100% - 9px),
      rgba(0, 0, 0, 0.2) calc(100% - 3px), transparent);
    mask-image: linear-gradient(to right,
      transparent, rgba(0, 0, 0, 0.2) 3px, rgba(0, 0, 0, 0.75) 9px, #000 14px,
      #000 calc(100% - 14px), rgba(0, 0, 0, 0.75) calc(100% - 9px),
      rgba(0, 0, 0, 0.2) calc(100% - 3px), transparent);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
  }

  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(tabs) {
    gap: 4px;
    align-items: center;
    min-height: 52px;
    /* End space scrolls with the list, keeping the first/last pill fully visible. */
    padding: 0 14px;
    box-sizing: border-box;
  }

  /* The adapter enables native without-scroll-controls. This prevents a flash
     before the component reacts; native swipe/drag and keyboard behavior stay. */
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(scroll-button) {
    display: none;
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
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header,
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header .toolbar,
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group,
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header .action-items,
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header .main-title {
      transition: none;
    }
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab::part(base) {
      transition: none;
      animation: none;
    }
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(nav) {
      scroll-behavior: auto;
    }
  }

  /* Keep focus and high-contrast tab boundaries completely legible. */
  :host([data-liquid-glass-navigation][data-liquid-glass-opaque]) > div:not(.edit-mode) > .header ha-tab-group::part(nav),
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group:has(ha-tab-group-tab:focus-visible)::part(nav) {
    -webkit-mask-image: none;
    mask-image: none;
  }

  @media (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active) {
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(nav) {
      -webkit-mask-image: none;
      mask-image: none;
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
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab[active]:not([disabled])::part(base),
    :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group-tab[aria-selected="true"]:not([disabled])::part(base) {
      color: HighlightText;
      background: Highlight;
      border-color: Highlight;
      forced-color-adjust: none;
    }
  }
`,t=String.raw`
  :host([data-liquid-glass-sections]) > .wrapper:not(.top-margin):not(.has-sidebar-tabs) > hui-view-header[hidden] + .container {
    /* The active root supplies 8px. Edit/disable immediately restores row-gap,
       even before the adapter removes this style; all other spacing is native. */
    padding-top: min(var(--lgn-empty-sections-top, var(--row-gap, 24px)), var(--row-gap, 24px));
  }
`,i="data-liquid-glass-sections";class a{styles=new Map;update(e){const a=new Set;for(const o of e.querySelectorAll("hui-view > hui-sections-view")){const e=o.shadowRoot,r=e?.querySelector(".wrapper"),s=r?.querySelector(":scope > hui-view-header"),n=s?.nextElementSibling;if(!o.isConnected||!e||r?.parentNode!==e||!n?.classList.contains("container"))continue;a.add(o),o.setAttribute(i,"");let d=this.styles.get(o);d?.isConnected||(d=o.ownerDocument.createElement("style"),d.id="liquid-glass-sections-spacing-style",d.textContent=t,e.append(d),this.styles.set(o,d))}for(const[e,t]of this.styles)a.has(e)||(t.remove(),e.removeAttribute(i),this.styles.delete(e))}restore(){for(const[e,t]of this.styles)t.remove(),e.removeAttribute(i);this.styles.clear()}}const o="data-liquid-glass-drawer-control",r=["--lgn-glass","--lgn-opaque","--lgn-rim","--lgn-sheen","--lgn-shadow","--lgn-hover","--lgn-safe-bottom"],s=["wa-show","wa-after-show","wa-hide","wa-after-hide"],n=`\n[${o}] { position:fixed; inset:auto; margin:0; padding:0; border:1px solid var(--lgn-rim,rgba(255,255,255,.6)); border-radius:50%; box-sizing:border-box; background:transparent; overflow:visible; box-shadow:var(--lgn-shadow,0 8px 28px #0003); bottom:calc(var(--lgn-safe-bottom,var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))) + 12px); }\n[${o}]:popover-open { display:grid; animation:lgn-drawer-appear 160ms ease-out; }\n[${o}]::backdrop { background:transparent; pointer-events:none; }\n[${o}]::before { content:""; position:absolute; inset:0; z-index:-1; border-radius:inherit; pointer-events:none; background:linear-gradient(155deg,var(--lgn-sheen,#fff6),transparent 50%,var(--lgn-sheen,#fff6)),var(--lgn-glass,#fafbffc2); backdrop-filter:blur(26px) saturate(175%); -webkit-backdrop-filter:blur(26px) saturate(175%); }\n[${o}] button { display:flex; align-items:center; justify-content:center; width:100%; height:100%; min-width:44px; min-height:44px; margin:0; padding:0; border:0; border-radius:inherit; background:transparent; color:inherit; font:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }\n[${o}] button:focus-visible { outline:2px solid var(--primary-color,#007aff); outline-offset:-4px; }\n[${o}] ha-icon { width:24px; height:24px; --mdc-icon-size:24px; }\n[${o}][data-opaque]::before { background:var(--lgn-opaque,#f9fafc); backdrop-filter:none; -webkit-backdrop-filter:none; }\n@media (hover:hover) { [${o}] button:hover { background:var(--lgn-hover,#0001); } }\n@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))) { [${o}]::before { background:var(--lgn-opaque,#f9fafc); } }\n@media (prefers-reduced-transparency:reduce),(prefers-contrast:more) { [${o}]::before { background:var(--lgn-opaque,#f9fafc); backdrop-filter:none; -webkit-backdrop-filter:none; } [${o}] { border-color:var(--divider-color,currentColor); } }\n@media (forced-colors:active) { [${o}] { color:ButtonText !important; border-color:ButtonText; box-shadow:none; } [${o}]::before { background:ButtonFace; backdrop-filter:none; -webkit-backdrop-filter:none; } }\n@media (prefers-reduced-motion:reduce) { [${o}]:popover-open { animation:none; } }\n@keyframes lgn-drawer-appear { from { opacity:0; scale:.9; } to { opacity:1; scale:1; } }\n`;class d{root;changed;drawer;wa;dialog;observed=new Set;observer;resize;popover;button;shown=!1;generation=0;constructor(e,t){this.root=e,this.changed=t}update(e,t,i){const a=function(e){let t=e;for(;t;){if(t instanceof HTMLElement&&"ha-drawer"===t.localName)return t;t=t.parentNode??(11===t.nodeType&&"host"in t?t.host:null)}}(this.root);if(!a||!this.root.isConnected)return void this.restore();const s=a.shadowRoot?.querySelector("wa-drawer")??void 0,d=s?.shadowRoot?.querySelector('dialog[part="dialog"]')??void 0;this.bind(a,s,d);const l=t?.shadowRoot?.querySelector("ha-icon-button"),h="modal"===a.type||"modal"===a.getAttribute("type"),c=!0===a.open||a.hasAttribute("open"),p=this.popover?.isConnected&&this.popover.parentElement===d;if(this.popover&&!p&&this.clearAccessory(),!h||!d?.open||!c&&!p||!t||!e.contains(t)||!l||i.keyboard||"start"!==s?.getAttribute("placement"))return void this.clearAccessory();const g=e.ownerDocument.defaultView.getComputedStyle(e),u=d.offsetWidth||d.getBoundingClientRect().width,b="rtl"===(a.direction||a.getAttribute("direction")),v=function(e){const t=Number.parseFloat(e);return Number.isFinite(t)?Math.max(0,t):0}(g.getPropertyValue(b?"--lgn-safe-left":"--lgn-safe-right"));let f;if(Number.isFinite(u)&&u>0&&Number.isFinite(i.width))for(const[e,t,a]of[[64,12,12],[56,4,4],[44,4,4]])if(!(u+t+e+a+v>i.width)){f={left:b?i.width-u-t-e:u+t,size:e};break}if(f){if(!this.popover){const t=e.ownerDocument.createElement("div");if("function"!=typeof t.showPopover||"function"!=typeof t.hidePopover)return;t.setAttribute(o,""),t.setAttribute("popover","manual");const i=e.ownerDocument.createElement("style");i.textContent=n;const a=e.ownerDocument.createElement("button");a.type="button",a.setAttribute("data-drawer","close");const r=e.ownerDocument.createElement("ha-icon");r.setAttribute("icon","mdi:menu"),r.setAttribute("aria-hidden","true"),a.append(r),t.append(i,a),d.append(t),this.popover=t,this.button=a}this.button.setAttribute("aria-label",l.label||l.getAttribute("aria-label")||l.getAttribute("label")||"Close sidebar");for(const e of r){const t=g.getPropertyValue(e).trim();t?this.setStyle(e,t):this.popover.style.removeProperty(e)}if(this.setStyle("color",g.color||"var(--primary-text-color, #1c1c1e)"),this.setStyle("font",g.font||"inherit"),this.setStyle("left",`${f.left}px`),this.setStyle("width",`${f.size}px`),this.setStyle("height",`${f.size}px`),this.popover.toggleAttribute("data-opaque",this.root.hasAttribute("data-liquid-glass-opaque")),!this.shown)try{this.popover.showPopover(),this.shown=!0}catch{return void this.clearAccessory()}return f}this.clearAccessory()}setStyle(e,t){this.popover.style.getPropertyValue(e)!==t&&this.popover.style.setProperty(e,t)}lifecycle=e=>{if(e.target!==this.wa)return;const t=this.generation;queueMicrotask(()=>{t===this.generation&&(this.dialog?.open&&this.dialog.isConnected||this.clearAccessory(),this.changed())})};bind(e,t,i){const a=new Set([e,...e.shadowRoot?[e.shadowRoot]:[],...t?[t]:[],...t?.shadowRoot?[t.shadowRoot]:[]]);if(this.drawer===e&&this.wa===t&&this.dialog===i&&a.size===this.observed.size&&[...a].every(e=>this.observed.has(e)))return;this.unobserve(),this.dialog!==i&&this.clearAccessory(),this.drawer=e,this.wa=t,this.dialog=i,this.observed=a,this.observer=new MutationObserver(e=>{e.some(e=>{const t=e.target instanceof Element?e.target:e.target.parentElement;return!t?.closest(`[${o}]`)})&&(this.dialog?.open&&this.dialog.isConnected||this.clearAccessory(),this.changed())});for(const e of a)this.observer.observe(e,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["open","type","direction"]});if(t)for(const e of s)t.addEventListener(e,this.lifecycle);i&&"undefined"!=typeof ResizeObserver&&(this.resize=new ResizeObserver(this.changed),this.resize.observe(i));const r=this.generation;for(const e of["ha-drawer","wa-drawer"])this.root.ownerDocument.defaultView?.customElements.whenDefined(e).then(()=>{r===this.generation&&this.changed()})}clearAccessory(){if(this.shown)try{this.popover?.hidePopover()}catch{}this.shown=!1,this.popover?.remove(),this.popover=void 0,this.button=void 0}unobserve(){if(this.generation++,this.observer?.disconnect(),this.observer=void 0,this.resize?.disconnect(),this.resize=void 0,this.wa)for(const e of s)this.wa.removeEventListener(e,this.lifecycle);this.observed.clear()}restore(){this.unobserve(),this.clearAccessory(),this.drawer=void 0,this.wa=void 0,this.dialog=void 0}destroy(){this.restore()}}const l="0.1.3",h={enabled:!1,scope:"mobile",reduce_transparency:!1,version:l};const c="data-liquid-glass-navigation",p=[c,"data-liquid-glass-opaque","data-liquid-glass-dark","data-liquid-glass-keyboard","data-liquid-glass-collapsed"],g=["--lgn-left","--lgn-width","--lgn-height","--lgn-collapse-left","--lgn-collapse-size"],u="liquid-glass-navigation-style";function b(e){for(const t of e.querySelectorAll("hui-sections-view,hui-view,hui-view-container"))if(t.shadowRoot){if("hui-sections-view"===t.localName&&t.shadowRoot.querySelector(".wrapper.has-sidebar-tabs .sidebar-tabs"))return!0;if(b(t.shadowRoot))return!0}return!1}class v{root;changed;style;resize;measured;wrapper;structural;active=!1;drawer;spacing=new a;tabs;constructor(e,t){this.root=e,this.changed=t,this.drawer=new d(e,t),e.shadowRoot&&(this.structural=new MutationObserver(e=>{e.some(e=>!e.target.closest?.(`#${u}`))&&t()}),this.structural.observe(e.shadowRoot,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class"]}))}update(t,i){const a=function(e){const t=e.shadowRoot;if(!t)return;const i=t.querySelector(".header"),a=i?.parentElement,o=i?.querySelector('slot[name="toolbar"]'),r=o?.querySelector(".toolbar"),s=a&&[...a.children].find(e=>"hui-view-container"===e.localName&&"view"===e.id);if(!(i&&a&&a.parentNode===t&&o&&r&&r.parentNode===o&&s))return;if(o.assignedElements().length||!r.querySelector(".action-items"))return;const n=r.querySelector("ha-tab-group");if(n){const e=[...n.children].filter(e=>"nav"===e.getAttribute("slot"));if(!e.length||e.some(e=>"ha-tab-group-tab"!==e.localName))return}else if(!r.querySelector(".main-title"))return;return{wrapper:a,header:i,toolbar:r,view:s}}(this.root);if(!(t.enabled&&!i.escape&&("all"===t.scope||i.width<=767))||!a||!this.root.isConnected||a.wrapper.classList.contains("edit-mode")||this.root.lovelace?.editMode||b(a.view))return void this.restore();const o=a.wrapper.getBoundingClientRect(),r=Math.max(0,o.left),s=Math.min(i.width,o.right);if(s-r<180)return void this.restore();this.style?.isConnected||(this.style=this.root.ownerDocument.createElement("style"),this.style.id=u,this.style.textContent=e,this.root.shadowRoot.append(this.style)),this.root.setAttribute(c,f),this.root.toggleAttribute("data-liquid-glass-opaque",t.reduce_transparency),this.root.toggleAttribute("data-liquid-glass-dark",i.dark),this.root.toggleAttribute("data-liquid-glass-keyboard",i.keyboard),this.setProperty("--lgn-left",Math.round(100*r)/100+"px"),this.setProperty("--lgn-width",Math.round(100*(s-r))/100+"px"),this.root.hasAttribute("data-liquid-glass-collapsed")||this.setProperty("--lgn-height",`${Math.max(66,Math.ceil(a.header.getBoundingClientRect().height))}px`),this.active=!0,this.configureTabs(a.toolbar),this.spacing.update(a.view);const n=this.drawer.update(a.header,a.toolbar.querySelector("ha-menu-button"),i);n&&(this.setProperty("--lgn-collapse-left",`${n.left}px`),this.setProperty("--lgn-collapse-size",`${n.size}px`)),this.root.toggleAttribute("data-liquid-glass-collapsed",Boolean(n)),this.measured===a.header&&this.wrapper===a.wrapper||(this.resize?.disconnect(),"undefined"!=typeof ResizeObserver&&(this.resize=new ResizeObserver(this.changed),this.resize.observe(a.header),this.resize.observe(a.wrapper)),this.measured=a.header,this.wrapper=a.wrapper)}configureTabs(e){const t=e.querySelector("ha-tab-group");this.tabs?.element!==t&&this.restoreTabs(),t&&"boolean"==typeof t.withoutScrollControls&&(this.tabs||(this.tabs={element:t,original:t.withoutScrollControls}),t.withoutScrollControls||(t.withoutScrollControls=!0))}restoreTabs(){!0===this.tabs?.element.withoutScrollControls&&(this.tabs.element.withoutScrollControls=this.tabs.original),this.tabs=void 0}setProperty(e,t){this.root.style.getPropertyValue(e)!==t&&this.root.style.setProperty(e,t)}restore(){if(this.drawer.restore(),this.spacing.restore(),this.restoreTabs(),this.active||this.style){this.active=!1,this.style?.remove(),this.style=void 0,this.resize?.disconnect(),this.resize=void 0,this.measured=void 0,this.wrapper=void 0;for(const e of p)this.root.removeAttribute(e);for(const e of g)this.root.style.removeProperty(e)}}destroy(){this.restore(),this.structural?.disconnect(),this.drawer.destroy()}}const f="1";function m(e){try{Promise.resolve(e?.()).catch(()=>{})}catch{}}class w{doc;win;config={...h};adapters=new Map;observers=new Map;connection;unsubscribe;onDisconnected;onReady;generation=0;frame;health;stopped=!0;retryAfter=0;layoutHeight=0;layoutWidth=0;constructor(e=document,t=window){this.doc=e,this.win=t}start(){if(this.stopped){this.stopped=!1,this.layoutHeight=this.win.innerHeight,this.layoutWidth=this.win.innerWidth;for(const e of["resize","location-changed","popstate","focusin","focusout"])this.win.addEventListener(e,this.schedule);this.doc.addEventListener("visibilitychange",this.schedule),this.win.visualViewport?.addEventListener("resize",this.schedule),this.win.visualViewport?.addEventListener("scroll",this.schedule),this.health=this.win.setInterval(()=>{this.doc.hidden||this.schedule()},2e3),this.reconcile()}}schedule=()=>{this.stopped||void 0!==this.frame||(this.frame=this.win.requestAnimationFrame(()=>{this.frame=void 0,this.reconcile()}))};reconcile(){if(this.stopped)return;const{roots:e,scopes:t}=function(e){const t=new Set,i=new Set,a=e=>{if(!i.has(e)){i.add(e);for(const i of e.querySelectorAll("home-assistant,home-assistant-main,partial-panel-resolver,ha-panel-lovelace,hui-root"))"hui-root"!==i.localName?i.shadowRoot&&a(i.shadowRoot):t.add(i)}};return a(e),{roots:t,scopes:i}}(this.doc);for(const[e,i]of this.observers)t.has(e)||(i.disconnect(),this.observers.delete(e));for(const e of t)if(!this.observers.has(e)){const t=new MutationObserver(this.schedule);t.observe(e,{childList:!0,subtree:!0}),this.observers.set(e,t)}for(const[t,i]of this.adapters)e.has(t)||(i.destroy(),this.adapters.delete(t));for(const t of e)!this.adapters.has(t)&&t.shadowRoot&&this.adapters.set(t,new v(t,this.schedule));const i=this.doc.querySelector("home-assistant"),a=i?.hass?.connection;(a!==this.connection||a&&!this.unsubscribe&&Date.now()>=this.retryAfter)&&this.connect(a),this.apply(i)}apply(e=this.doc.querySelector("home-assistant")){const t=function(e){let t=e.activeElement;for(;t?.shadowRoot?.activeElement;)t=t.shadowRoot.activeElement;return t instanceof HTMLElement&&(!(!t.isContentEditable&&"textarea"!==t.localName)||"input"===t.localName&&!["button","submit","reset","checkbox","radio","range","color","file","hidden"].includes(t.type))}(this.doc);(!t||Math.abs(this.win.innerWidth-this.layoutWidth)>80)&&(this.layoutHeight=this.win.innerHeight,this.layoutWidth=this.win.innerWidth);const i=this.win.visualViewport?.height??this.win.innerHeight,a=t&&i<this.layoutHeight-140&&i<.8*this.layoutHeight,o="off"===new URL(this.win.location.href).searchParams.get("liquid_glass"),r=this.win.matchMedia("(prefers-color-scheme: dark)").matches;for(const[t,i]of this.adapters)i.update(this.config,{width:this.win.innerWidth,keyboard:a,escape:o,dark:t.hass?.themes?.darkMode??e?.hass?.themes?.darkMode??r})}async connect(e){if(this.disconnect(),this.connection=e,!e)return;const t=this.generation;this.retryAfter=Number.POSITIVE_INFINITY;const i=()=>!this.stopped&&e===this.connection&&t===this.generation;this.onDisconnected=()=>{i()&&(this.config={...h},this.restoreAll())},this.onReady=()=>{i()&&queueMicrotask(()=>{i()&&this.connect(e)})},e.addEventListener?.("disconnected",this.onDisconnected),e.addEventListener?.("ready",this.onReady);try{const i=await e.subscribeMessage(e=>{this.stopped||t!==this.generation||(this.config=function(e){if(!e||"object"!=typeof e)return{...h};const t=e;return"boolean"==typeof t.enabled&&["mobile","all"].includes(String(t.scope))&&"boolean"==typeof t.reduce_transparency&&"string"==typeof t.version?{enabled:t.enabled,scope:t.scope,reduce_transparency:t.reduce_transparency,version:t.version}:{...h}}(e),this.config.enabled?this.apply():this.restoreAll())},{type:"liquid_glass_navigation/subscribe"},{resubscribe:!1});if(this.stopped||t!==this.generation)return void m(i);this.unsubscribe=i}catch{if(t!==this.generation)return;this.config={...h},this.restoreAll(),this.retryAfter=Date.now()+1e4}}restoreAll(){for(const e of this.adapters.values())e.restore()}disconnect(){this.generation++,this.onDisconnected&&this.connection?.removeEventListener?.("disconnected",this.onDisconnected),this.onReady&&this.connection?.removeEventListener?.("ready",this.onReady),this.onDisconnected=void 0,this.onReady=void 0,m(this.unsubscribe),this.unsubscribe=void 0,this.connection=void 0,this.config={...h},this.restoreAll(),this.retryAfter=0}stop(){if(!this.stopped){this.stopped=!0,this.disconnect();for(const e of["resize","location-changed","popstate","focusin","focusout"])this.win.removeEventListener(e,this.schedule);this.doc.removeEventListener("visibilitychange",this.schedule),this.win.visualViewport?.removeEventListener("resize",this.schedule),this.win.visualViewport?.removeEventListener("scroll",this.schedule),void 0!==this.frame&&this.win.cancelAnimationFrame(this.frame),this.frame=void 0,this.win.clearInterval(this.health),this.health=void 0;for(const e of this.observers.values())e.disconnect();this.observers.clear();for(const e of this.adapters.values())e.destroy();this.adapters.clear()}}}const y=Symbol.for("liquid-glass-navigation.controller"),x=window,q=x[y];if(!q||q.version!==l){q?.controller.stop();const e=new w;x[y]={version:l,controller:e},e.start(),console.info(`LIQUID GLASS NAVIGATION ${l}`)}
