const t=String.raw`
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

  /* Keep native overflow discovery, scrolling, arrows and keyboard navigation. */
  :host([data-liquid-glass-navigation]) > div:not(.edit-mode) > .header ha-tab-group::part(scroll-button) {
    width: 44px;
    min-width: 44px;
    height: 48px;
    inset-block-start: 2px;
    inset-block-end: 2px;
    border-radius: 24px;
    color: var(--primary-text-color, #1c1c1e);
    background: var(--lgn-opaque);
    z-index: 1;
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
`,e="0.1.0",i={enabled:!1,scope:"mobile",reduce_transparency:!1,version:e};const a="data-liquid-glass-navigation",o=[a,"data-liquid-glass-opaque","data-liquid-glass-dark","data-liquid-glass-keyboard"],r=["--lgn-left","--lgn-width","--lgn-height"],s="liquid-glass-navigation-style";function n(t){for(const e of t.querySelectorAll("hui-sections-view,hui-view,hui-view-container"))if(e.shadowRoot){if("hui-sections-view"===e.localName&&e.shadowRoot.querySelector(".wrapper.has-sidebar-tabs .sidebar-tabs"))return!0;if(n(e.shadowRoot))return!0}return!1}class d{root;changed;style;resize;measured;wrapper;structural;active=!1;constructor(t,e){this.root=t,this.changed=e,t.shadowRoot&&(this.structural=new MutationObserver(t=>{t.some(t=>!t.target.closest?.(`#${s}`))&&e()}),this.structural.observe(t.shadowRoot,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class"]}))}update(e,i){const o=function(t){const e=t.shadowRoot;if(!e)return;const i=e.querySelector(".header"),a=i?.parentElement,o=i?.querySelector('slot[name="toolbar"]'),r=o?.querySelector(".toolbar"),s=a&&[...a.children].find(t=>"hui-view-container"===t.localName&&"view"===t.id);if(!(i&&a&&a.parentNode===e&&o&&r&&r.parentNode===o&&s))return;if(o.assignedElements().length||!r.querySelector(".action-items"))return;const n=r.querySelector("ha-tab-group");if(n){const t=[...n.children].filter(t=>"nav"===t.getAttribute("slot"));if(!t.length||t.some(t=>"ha-tab-group-tab"!==t.localName))return}else if(!r.querySelector(".main-title"))return;return{wrapper:a,header:i,toolbar:r,view:s}}(this.root);if(!(e.enabled&&!i.escape&&("all"===e.scope||i.width<=767))||!o||!this.root.isConnected||o.wrapper.classList.contains("edit-mode")||this.root.lovelace?.editMode||n(o.view))return void this.restore();const r=o.wrapper.getBoundingClientRect(),d=Math.max(0,r.left),l=Math.min(i.width,r.right);l-d<180?this.restore():(this.style?.isConnected||(this.style=this.root.ownerDocument.createElement("style"),this.style.id=s,this.style.textContent=t,this.root.shadowRoot.append(this.style)),this.root.setAttribute(a,h),this.root.toggleAttribute("data-liquid-glass-opaque",e.reduce_transparency),this.root.toggleAttribute("data-liquid-glass-dark",i.dark),this.root.toggleAttribute("data-liquid-glass-keyboard",i.keyboard),this.setProperty("--lgn-left",Math.round(100*d)/100+"px"),this.setProperty("--lgn-width",Math.round(100*(l-d))/100+"px"),this.setProperty("--lgn-height",`${Math.max(64,Math.ceil(o.header.getBoundingClientRect().height))}px`),this.active=!0,this.measured===o.header&&this.wrapper===o.wrapper||(this.resize?.disconnect(),"undefined"!=typeof ResizeObserver&&(this.resize=new ResizeObserver(this.changed),this.resize.observe(o.header),this.resize.observe(o.wrapper)),this.measured=o.header,this.wrapper=o.wrapper))}setProperty(t,e){this.root.style.getPropertyValue(t)!==e&&this.root.style.setProperty(t,e)}restore(){if(this.active||this.style){this.active=!1,this.style?.remove(),this.style=void 0,this.resize?.disconnect(),this.resize=void 0,this.measured=void 0,this.wrapper=void 0;for(const t of o)this.root.removeAttribute(t);for(const t of r)this.root.style.removeProperty(t)}}destroy(){this.restore(),this.structural?.disconnect()}}const h="1";function l(t){try{Promise.resolve(t?.()).catch(()=>{})}catch{}}class c{doc;win;config={...i};adapters=new Map;observers=new Map;connection;unsubscribe;onDisconnected;onReady;generation=0;frame;health;stopped=!0;retryAfter=0;layoutHeight=0;layoutWidth=0;constructor(t=document,e=window){this.doc=t,this.win=e}start(){if(this.stopped){this.stopped=!1,this.layoutHeight=this.win.innerHeight,this.layoutWidth=this.win.innerWidth;for(const t of["resize","location-changed","popstate","focusin","focusout"])this.win.addEventListener(t,this.schedule);this.doc.addEventListener("visibilitychange",this.schedule),this.win.visualViewport?.addEventListener("resize",this.schedule),this.win.visualViewport?.addEventListener("scroll",this.schedule),this.health=this.win.setInterval(()=>{this.doc.hidden||this.schedule()},2e3),this.reconcile()}}schedule=()=>{this.stopped||void 0!==this.frame||(this.frame=this.win.requestAnimationFrame(()=>{this.frame=void 0,this.reconcile()}))};reconcile(){if(this.stopped)return;const{roots:t,scopes:e}=function(t){const e=new Set,i=new Set,a=t=>{if(!i.has(t)){i.add(t);for(const i of t.querySelectorAll("home-assistant,home-assistant-main,partial-panel-resolver,ha-panel-lovelace,hui-root"))"hui-root"!==i.localName?i.shadowRoot&&a(i.shadowRoot):e.add(i)}};return a(t),{roots:e,scopes:i}}(this.doc);for(const[t,i]of this.observers)e.has(t)||(i.disconnect(),this.observers.delete(t));for(const t of e)if(!this.observers.has(t)){const e=new MutationObserver(this.schedule);e.observe(t,{childList:!0,subtree:!0}),this.observers.set(t,e)}for(const[e,i]of this.adapters)t.has(e)||(i.destroy(),this.adapters.delete(e));for(const e of t)!this.adapters.has(e)&&e.shadowRoot&&this.adapters.set(e,new d(e,this.schedule));const i=this.doc.querySelector("home-assistant"),a=i?.hass?.connection;(a!==this.connection||a&&!this.unsubscribe&&Date.now()>=this.retryAfter)&&this.connect(a),this.apply(i)}apply(t=this.doc.querySelector("home-assistant")){const e=function(t){let e=t.activeElement;for(;e?.shadowRoot?.activeElement;)e=e.shadowRoot.activeElement;return e instanceof HTMLElement&&(!(!e.isContentEditable&&"textarea"!==e.localName)||"input"===e.localName&&!["button","submit","reset","checkbox","radio","range","color","file","hidden"].includes(e.type))}(this.doc);(!e||Math.abs(this.win.innerWidth-this.layoutWidth)>80)&&(this.layoutHeight=this.win.innerHeight,this.layoutWidth=this.win.innerWidth);const i=this.win.visualViewport?.height??this.win.innerHeight,a=e&&i<this.layoutHeight-140&&i<.8*this.layoutHeight,o="off"===new URL(this.win.location.href).searchParams.get("liquid_glass"),r=this.win.matchMedia("(prefers-color-scheme: dark)").matches;for(const[e,i]of this.adapters)i.update(this.config,{width:this.win.innerWidth,keyboard:a,escape:o,dark:e.hass?.themes?.darkMode??t?.hass?.themes?.darkMode??r})}async connect(t){if(this.disconnect(),this.connection=t,!t)return;const e=this.generation;this.retryAfter=Number.POSITIVE_INFINITY;const a=()=>!this.stopped&&t===this.connection&&e===this.generation;this.onDisconnected=()=>{a()&&(this.config={...i},this.restoreAll())},this.onReady=()=>{a()&&queueMicrotask(()=>{a()&&this.connect(t)})},t.addEventListener?.("disconnected",this.onDisconnected),t.addEventListener?.("ready",this.onReady);try{const a=await t.subscribeMessage(t=>{this.stopped||e!==this.generation||(this.config=function(t){if(!t||"object"!=typeof t)return{...i};const e=t;return"boolean"==typeof e.enabled&&["mobile","all"].includes(String(e.scope))&&"boolean"==typeof e.reduce_transparency&&"string"==typeof e.version?{enabled:e.enabled,scope:e.scope,reduce_transparency:e.reduce_transparency,version:e.version}:{...i}}(t),this.config.enabled?this.apply():this.restoreAll())},{type:"liquid_glass_navigation/subscribe"},{resubscribe:!1});if(this.stopped||e!==this.generation)return void l(a);this.unsubscribe=a}catch{if(e!==this.generation)return;this.config={...i},this.restoreAll(),this.retryAfter=Date.now()+1e4}}restoreAll(){for(const t of this.adapters.values())t.restore()}disconnect(){this.generation++,this.onDisconnected&&this.connection?.removeEventListener?.("disconnected",this.onDisconnected),this.onReady&&this.connection?.removeEventListener?.("ready",this.onReady),this.onDisconnected=void 0,this.onReady=void 0,l(this.unsubscribe),this.unsubscribe=void 0,this.connection=void 0,this.config={...i},this.restoreAll(),this.retryAfter=0}stop(){if(!this.stopped){this.stopped=!0,this.disconnect();for(const t of["resize","location-changed","popstate","focusin","focusout"])this.win.removeEventListener(t,this.schedule);this.doc.removeEventListener("visibilitychange",this.schedule),this.win.visualViewport?.removeEventListener("resize",this.schedule),this.win.visualViewport?.removeEventListener("scroll",this.schedule),void 0!==this.frame&&this.win.cancelAnimationFrame(this.frame),this.frame=void 0,this.win.clearInterval(this.health),this.health=void 0;for(const t of this.observers.values())t.disconnect();this.observers.clear();for(const t of this.adapters.values())t.destroy();this.adapters.clear()}}}const g=Symbol.for("liquid-glass-navigation.controller"),p=window,u=p[g];if(!u||u.version!==e){u?.controller.stop();const t=new c;p[g]={version:e,controller:t},t.start(),console.info(`LIQUID GLASS NAVIGATION ${e}`)}
