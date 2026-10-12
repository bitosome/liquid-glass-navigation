import {HeaderAdapter} from './adapter.js';
import {DISABLED, parseConfig, type HassConnection, type HassHost, type NavigationConfig, type Unsubscribe} from './types.js';

function dispose(unsubscribe?: Unsubscribe) {
  try { void Promise.resolve(unsubscribe?.()).catch(() => {}); }
  catch { /* A closed websocket no longer needs an unsubscribe request. */ }
}

const SHELL = 'home-assistant,home-assistant-main,partial-panel-resolver,ha-panel-lovelace,hui-root';
export function discoverShell(document: Document): {roots: Set<HassHost>; scopes: Set<Node>} {
  const roots = new Set<HassHost>(), scopes = new Set<Node>();
  const visit = (scope: Document | ShadowRoot) => {
    if (scopes.has(scope)) return;
    scopes.add(scope);
    for (const node of scope.querySelectorAll<HassHost>(SHELL)) {
      if (node.localName === 'hui-root') { roots.add(node); continue; }
      if (node.shadowRoot) visit(node.shadowRoot);
    }
  };
  visit(document);
  return {roots, scopes};
}
export function focusedEditor(document: Document): boolean {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable || element.localName === 'textarea') return true;
  return element.localName === 'input' && !['button','submit','reset','checkbox','radio','range','color','file','hidden'].includes((element as HTMLInputElement).type);
}

/** Observe only the HA shell, never patch Lit, native tabs, or dashboard data. */
export class NavigationController {
  private config: NavigationConfig = {...DISABLED};
  private adapters = new Map<HassHost, HeaderAdapter>();
  private observers = new Map<Node, MutationObserver>();
  private connection?: HassConnection;
  private unsubscribe?: Unsubscribe;
  private onDisconnected?: () => void;
  private onReady?: () => void;
  private generation = 0;
  private frame?: number;
  private health?: number;
  private stopped = true;
  private retryAfter = 0;
  private layoutHeight = 0;
  private layoutWidth = 0;
  constructor(private readonly doc = document, private readonly win = window) {}
  start() {
    if (!this.stopped) return;
    this.stopped = false;
    this.layoutHeight = this.win.innerHeight;
    this.layoutWidth = this.win.innerWidth;
    for (const event of ['resize','location-changed','popstate','focusin','focusout']) this.win.addEventListener(event, this.schedule);
    this.doc.addEventListener('visibilitychange', this.schedule);
    this.win.visualViewport?.addEventListener('resize', this.schedule);
    this.win.visualViewport?.addEventListener('scroll', this.schedule);
    // A small shell-only heartbeat catches late shadow creation and HA connection
    // replacement; it never polls the server or traverses card shadow trees.
    this.health = this.win.setInterval(() => { if (!this.doc.hidden) this.schedule(); }, 2000);
    this.reconcile();
  }
  readonly schedule = () => {
    if (this.stopped || this.frame !== undefined) return;
    this.frame = this.win.requestAnimationFrame(() => { this.frame = undefined; this.reconcile(); });
  };
  reconcile() {
    if (this.stopped) return;
    const {roots, scopes} = discoverShell(this.doc);
    for (const [node, observer] of this.observers) if (!scopes.has(node)) { observer.disconnect(); this.observers.delete(node); }
    for (const node of scopes) if (!this.observers.has(node)) {
      const observer = new MutationObserver(this.schedule);
      observer.observe(node, {childList: true, subtree: true});
      this.observers.set(node, observer);
    }
    for (const [root, adapter] of this.adapters) if (!roots.has(root)) { adapter.destroy(); this.adapters.delete(root); }
    for (const root of roots) if (!this.adapters.has(root) && root.shadowRoot) this.adapters.set(root, new HeaderAdapter(root, this.schedule));
    const app = this.doc.querySelector<HassHost>('home-assistant');
    const connection = app?.hass?.connection;
    if (connection !== this.connection || connection && !this.unsubscribe && Date.now() >= this.retryAfter) void this.connect(connection);
    this.apply(app);
  }
  private apply(app = this.doc.querySelector<HassHost>('home-assistant')) {
    const editing = focusedEditor(this.doc);
    if (!editing || Math.abs(this.win.innerWidth - this.layoutWidth) > 80) {
      this.layoutHeight = this.win.innerHeight; this.layoutWidth = this.win.innerWidth;
    }
    const viewportHeight = this.win.visualViewport?.height ?? this.win.innerHeight;
    const keyboard = editing && viewportHeight < this.layoutHeight - 140 && viewportHeight < this.layoutHeight * .8;
    const escape = new URL(this.win.location.href).searchParams.get('liquid_glass') === 'off';
    const fallbackDark = this.win.matchMedia('(prefers-color-scheme: dark)').matches;
    for (const [root, adapter] of this.adapters) adapter.update(this.config, {
      width: this.win.innerWidth, keyboard, escape,
      dark: root.hass?.themes?.darkMode ?? app?.hass?.themes?.darkMode ?? fallbackDark,
    });
  }
  private async connect(connection?: HassConnection) {
    this.disconnect();
    this.connection = connection;
    if (!connection) return;
    const generation = this.generation;
    this.retryAfter = Number.POSITIVE_INFINITY;
    const current = () => !this.stopped && connection === this.connection && generation === this.generation;
    this.onDisconnected = () => {
      if (!current()) return;
      this.config = {...DISABLED}; this.restoreAll();
    };
    this.onReady = () => {
      if (!current()) return;
      // Native HA dispatch iterates the listener array directly. Rebind in a
      // microtask so another extension's ready listener is never skipped.
      queueMicrotask(() => { if (current()) void this.connect(connection); });
    };
    connection.addEventListener?.('disconnected', this.onDisconnected);
    connection.addEventListener?.('ready', this.onReady);
    try {
      const unsubscribe = await connection.subscribeMessage<unknown>(event => {
        if (this.stopped || generation !== this.generation) return;
        this.config = parseConfig(event);
        // Disable/unload works even in a hidden tab where animation frames pause.
        if (!this.config.enabled) this.restoreAll(); else this.apply();
      }, {type: 'liquid_glass_navigation/subscribe'}, {resubscribe: false});
      if (this.stopped || generation !== this.generation) { dispose(unsubscribe); return; }
      this.unsubscribe = unsubscribe;
    } catch {
      if (generation !== this.generation) return;
      this.config = {...DISABLED}; this.restoreAll();
      this.retryAfter = Date.now() + 10000;
    }
  }
  private restoreAll() { for (const adapter of this.adapters.values()) adapter.restore(); }
  private disconnect() {
    this.generation++;
    if (this.onDisconnected) this.connection?.removeEventListener?.('disconnected', this.onDisconnected);
    if (this.onReady) this.connection?.removeEventListener?.('ready', this.onReady);
    this.onDisconnected = undefined; this.onReady = undefined;
    dispose(this.unsubscribe);
    this.unsubscribe = undefined; this.connection = undefined;
    this.config = {...DISABLED}; this.restoreAll();
    this.retryAfter = 0;
  }
  stop() {
    if (this.stopped) return;
    this.stopped = true; this.disconnect();
    for (const event of ['resize','location-changed','popstate','focusin','focusout']) this.win.removeEventListener(event, this.schedule);
    this.doc.removeEventListener('visibilitychange', this.schedule);
    this.win.visualViewport?.removeEventListener('resize', this.schedule);
    this.win.visualViewport?.removeEventListener('scroll', this.schedule);
    if (this.frame !== undefined) this.win.cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.win.clearInterval(this.health); this.health = undefined;
    for (const observer of this.observers.values()) observer.disconnect(); this.observers.clear();
    for (const adapter of this.adapters.values()) adapter.destroy(); this.adapters.clear();
  }
}
