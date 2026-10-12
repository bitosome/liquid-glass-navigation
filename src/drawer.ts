/**
 * Native HA 20260930.2 modal drawer accessory. The dashboard is inert while
 * dialog.showModal() is active, so its actual menu cannot simply be raised.
 * This owned popover remains a descendant of that modal, without moving or
 * replacing any native elements or changing the drawer's focus/dismissal rules.
 */
const OWNED = 'data-liquid-glass-drawer-control';
const TOKENS = ['--lgn-glass', '--lgn-opaque', '--lgn-rim', '--lgn-sheen', '--lgn-shadow', '--lgn-hover', '--lgn-safe-bottom'];
const EVENTS = ['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide'];
const CSS = `
[${OWNED}] { position:fixed; inset:auto; margin:0; padding:0; border:1px solid var(--lgn-rim,rgba(255,255,255,.6)); border-radius:50%; box-sizing:border-box; background:transparent; overflow:visible; box-shadow:var(--lgn-shadow,0 8px 28px #0003); bottom:calc(var(--lgn-safe-bottom,var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))) + 12px); }
[${OWNED}]:popover-open { display:grid; animation:lgn-drawer-appear 160ms ease-out; }
[${OWNED}]::backdrop { background:transparent; pointer-events:none; }
[${OWNED}]::before { content:""; position:absolute; inset:0; z-index:-1; border-radius:inherit; pointer-events:none; background:linear-gradient(155deg,var(--lgn-sheen,#fff6),transparent 50%,var(--lgn-sheen,#fff6)),var(--lgn-glass,#fafbffc2); backdrop-filter:blur(26px) saturate(175%); -webkit-backdrop-filter:blur(26px) saturate(175%); }
[${OWNED}] button { display:flex; align-items:center; justify-content:center; width:100%; height:100%; min-width:44px; min-height:44px; margin:0; padding:0; border:0; border-radius:inherit; background:transparent; color:inherit; font:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
[${OWNED}] button:focus-visible { outline:2px solid var(--primary-color,#007aff); outline-offset:-4px; }
[${OWNED}] ha-icon { width:24px; height:24px; --mdc-icon-size:24px; }
[${OWNED}][data-opaque]::before { background:var(--lgn-opaque,#f9fafc); backdrop-filter:none; -webkit-backdrop-filter:none; }
@media (hover:hover) { [${OWNED}] button:hover { background:var(--lgn-hover,#0001); } }
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))) { [${OWNED}]::before { background:var(--lgn-opaque,#f9fafc); } }
@media (prefers-reduced-transparency:reduce),(prefers-contrast:more) { [${OWNED}]::before { background:var(--lgn-opaque,#f9fafc); backdrop-filter:none; -webkit-backdrop-filter:none; } [${OWNED}] { border-color:var(--divider-color,currentColor); } }
@media (forced-colors:active) { [${OWNED}] { color:ButtonText !important; border-color:ButtonText; box-shadow:none; } [${OWNED}]::before { background:ButtonFace; backdrop-filter:none; -webkit-backdrop-filter:none; } }
@media (prefers-reduced-motion:reduce) { [${OWNED}]:popover-open { animation:none; } }
@keyframes lgn-drawer-appear { from { opacity:0; scale:.9; } to { opacity:1; scale:1; } }
`;

function nearestDrawer(root: HTMLElement): HTMLElement | undefined {
  let node: Node | null = root;
  while (node) {
    if (node instanceof HTMLElement && node.localName === 'ha-drawer') return node;
    node = node.parentNode ?? (node.nodeType === 11 && 'host' in node ? (node as ShadowRoot).host : null);
  }
  return undefined;
}
function px(value: string): number { const number = Number.parseFloat(value); return Number.isFinite(number) ? Math.max(0, number) : 0; }
interface DrawerHost extends HTMLElement {open?: boolean; type?: string; direction?: string}
interface MenuIcon extends HTMLElement {label?: string}

export class DrawerAdapter {
  private drawer?: DrawerHost;
  private wa?: HTMLElement;
  private dialog?: HTMLDialogElement;
  private observed = new Set<Node>();
  private observer?: MutationObserver;
  private resize?: ResizeObserver;
  private popover?: HTMLDivElement;
  private button?: HTMLButtonElement;
  private shown = false;
  private generation = 0;
  constructor(private readonly root: HTMLElement, private readonly changed: () => void) {}

  update(header: HTMLElement, menu: HTMLElement | null, viewport: {width: number; keyboard: boolean}): {left: number; size: number} | undefined {
    const drawer = nearestDrawer(this.root) as DrawerHost | undefined;
    if (!drawer || !this.root.isConnected) { this.restore(); return undefined; }
    const wa = drawer.shadowRoot?.querySelector<HTMLElement>('wa-drawer') ?? undefined;
    const dialog = wa?.shadowRoot?.querySelector<HTMLDialogElement>('dialog[part="dialog"]') ?? undefined;
    this.bind(drawer, wa, dialog);
    const nativeMenu = menu?.shadowRoot?.querySelector<MenuIcon>('ha-icon-button');
    const modal = drawer.type === 'modal' || drawer.getAttribute('type') === 'modal';
    const opening = drawer.open === true || drawer.hasAttribute('open');
    const existing = this.popover?.isConnected && this.popover.parentElement === dialog;
    if (this.popover && !existing) this.clearAccessory();
    if (!modal || !dialog?.open || (!opening && !existing) || !menu || !header.contains(menu) || !nativeMenu || viewport.keyboard || wa?.getAttribute('placement') !== 'start') {
      this.clearAccessory(); return undefined;
    }
    const style = header.ownerDocument.defaultView!.getComputedStyle(header);
    const width = dialog.offsetWidth || dialog.getBoundingClientRect().width;
    const rtl = (drawer.direction || drawer.getAttribute('direction')) === 'rtl';
    const safe = px(style.getPropertyValue(rtl ? '--lgn-safe-left' : '--lgn-safe-right'));
    let layout: {left: number; size: number} | undefined;
    if (Number.isFinite(width) && width > 0 && Number.isFinite(viewport.width)) {
      for (const [size, gap, edge] of [[64, 12, 12], [56, 4, 4], [44, 4, 4]]) {
        if (width + gap + size + edge + safe > viewport.width) continue;
        layout = {left: rtl ? viewport.width - width - gap - size : width + gap, size};
        break;
      }
    }
    if (!layout) { this.clearAccessory(); return undefined; }
    if (!this.popover) {
      const popover = header.ownerDocument.createElement('div');
      if (typeof popover.showPopover !== 'function' || typeof popover.hidePopover !== 'function') return undefined;
      popover.setAttribute(OWNED, ''); popover.setAttribute('popover', 'manual');
      const css = header.ownerDocument.createElement('style'); css.textContent = CSS;
      const button = header.ownerDocument.createElement('button');
      button.type = 'button';
      // This declarative command bubbles to WebAwesome's existing click handler.
      button.setAttribute('data-drawer', 'close');
      const icon = header.ownerDocument.createElement('ha-icon'); icon.setAttribute('icon', 'mdi:menu'); icon.setAttribute('aria-hidden', 'true');
      button.append(icon); popover.append(css, button); dialog.append(popover);
      this.popover = popover; this.button = button;
    }
    this.button!.setAttribute('aria-label', nativeMenu.label || nativeMenu.getAttribute('aria-label') || nativeMenu.getAttribute('label') || 'Close sidebar');
    for (const token of TOKENS) {
      const value = style.getPropertyValue(token).trim();
      if (value) this.setStyle(token, value); else this.popover.style.removeProperty(token);
    }
    this.setStyle('color', style.color || 'var(--primary-text-color, #1c1c1e)');
    this.setStyle('font', style.font || 'inherit');
    this.setStyle('left', `${layout.left}px`); this.setStyle('width', `${layout.size}px`); this.setStyle('height', `${layout.size}px`);
    this.popover.toggleAttribute('data-opaque', this.root.hasAttribute('data-liquid-glass-opaque'));
    if (!this.shown) {
      try { this.popover.showPopover(); this.shown = true; }
      catch { this.clearAccessory(); return undefined; }
    }
    return layout;
  }
  private setStyle(name: string, value: string) {
    if (this.popover!.style.getPropertyValue(name) !== value) this.popover!.style.setProperty(name, value);
  }
  private lifecycle = (event: Event) => {
    if (event.target !== this.wa) return;
    // wa-show is sent before showModal. Deferral also sees canceled hide events.
    const generation = this.generation;
    queueMicrotask(() => {
      if (generation !== this.generation) return;
      if (!this.dialog?.open || !this.dialog.isConnected) this.clearAccessory();
      this.changed();
    });
  };
  private bind(drawer: DrawerHost, wa?: HTMLElement, dialog?: HTMLDialogElement) {
    const scopes = new Set<Node>([drawer, ...(drawer.shadowRoot ? [drawer.shadowRoot] : []), ...(wa ? [wa] : []), ...(wa?.shadowRoot ? [wa.shadowRoot] : [])]);
    if (this.drawer === drawer && this.wa === wa && this.dialog === dialog && scopes.size === this.observed.size && [...scopes].every(scope => this.observed.has(scope))) return;
    this.unobserve();
    if (this.dialog !== dialog) this.clearAccessory();
    this.drawer = drawer; this.wa = wa; this.dialog = dialog; this.observed = scopes;
    this.observer = new MutationObserver(records => {
      const relevant = records.some(record => {
        const target = record.target instanceof Element ? record.target : record.target.parentElement;
        return !target?.closest(`[${OWNED}]`);
      });
      if (!relevant) return;
      if (!this.dialog?.open || !this.dialog.isConnected) this.clearAccessory();
      this.changed();
    });
    for (const scope of scopes) this.observer.observe(scope, {childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'type', 'direction']});
    if (wa) for (const event of EVENTS) wa.addEventListener(event, this.lifecycle);
    if (dialog && typeof ResizeObserver !== 'undefined') {
      this.resize = new ResizeObserver(this.changed); this.resize.observe(dialog);
    }
    const generation = this.generation;
    // Custom elements may receive their shadow roots after the shell appears.
    for (const tag of ['ha-drawer', 'wa-drawer']) void this.root.ownerDocument.defaultView?.customElements.whenDefined(tag).then(() => {
      if (generation === this.generation) this.changed();
    });
  }
  private clearAccessory() {
    if (this.shown) { try { this.popover?.hidePopover(); } catch { /* Native dialog/root may already have been removed. */ } }
    this.shown = false; this.popover?.remove(); this.popover = undefined; this.button = undefined;
  }
  private unobserve() {
    this.generation++;
    this.observer?.disconnect(); this.observer = undefined;
    this.resize?.disconnect(); this.resize = undefined;
    if (this.wa) for (const event of EVENTS) this.wa.removeEventListener(event, this.lifecycle);
    this.observed.clear();
  }
  restore() { this.unobserve(); this.clearAccessory(); this.drawer = undefined; this.wa = undefined; this.dialog = undefined; }
  destroy() { this.restore(); }
}
