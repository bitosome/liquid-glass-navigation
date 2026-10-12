import {SectionsSpacingAdapter} from './view-spacing.js';
import {DrawerAdapter} from './drawer.js';
import {NAVIGATION_CSS} from './styles.js';
import {MOBILE_MAX_WIDTH, type HassHost, type NavigationConfig} from './types.js';

const ACTIVE = 'data-liquid-glass-navigation';
const OWNED_ATTRIBUTES = [ACTIVE, 'data-liquid-glass-opaque', 'data-liquid-glass-dark', 'data-liquid-glass-keyboard', 'data-liquid-glass-collapsed'];
const OWNED_PROPERTIES = ['--lgn-left', '--lgn-width', '--lgn-height', '--lgn-collapse-left', '--lgn-collapse-size'];
const STYLE_ID = 'liquid-glass-navigation-style';
export interface NativeHeader {wrapper: HTMLElement; header: HTMLElement; toolbar: HTMLElement; view: HTMLElement}

/** Only the verified HA 20260930.2 structure. Unknown structures retain stock UI. */
export function nativeHeader(root: HassHost): NativeHeader | undefined {
  const shadow = root.shadowRoot;
  if (!shadow) return undefined;
  const header = shadow.querySelector<HTMLElement>('.header');
  const wrapper = header?.parentElement;
  const slot = header?.querySelector<HTMLSlotElement>('slot[name="toolbar"]');
  const toolbar = slot?.querySelector<HTMLElement>('.toolbar');
  const view = wrapper && [...wrapper.children].find(e => e.localName === 'hui-view-container' && e.id === 'view') as HTMLElement | undefined;
  if (!header || !wrapper || wrapper.parentNode !== shadow || !slot || !toolbar || toolbar.parentNode !== slot || !view) return undefined;
  if (slot.assignedElements().length || !toolbar.querySelector('.action-items')) return undefined;
  const tabs = toolbar.querySelector('ha-tab-group');
  if (tabs) {
    const children = [...tabs.children].filter(e => e.getAttribute('slot') === 'nav');
    if (!children.length || children.some(e => e.localName !== 'ha-tab-group-tab')) return undefined;
  } else if (!toolbar.querySelector('.main-title')) return undefined;
  return {wrapper, header, toolbar, view};
}

/** Native sections can have their own bottom switcher. Leave those layouts alone. */
export function hasBottomSections(root: ParentNode): boolean {
  for (const node of root.querySelectorAll<HTMLElement>('hui-sections-view,hui-view,hui-view-container')) {
    if (!node.shadowRoot) continue;
    if (node.localName === 'hui-sections-view' && node.shadowRoot.querySelector('.wrapper.has-sidebar-tabs .sidebar-tabs')) return true;
    if (hasBottomSections(node.shadowRoot)) return true;
  }
  return false;
}

export class HeaderAdapter {
  private style?: HTMLStyleElement;
  private resize?: ResizeObserver;
  private measured?: HTMLElement;
  private wrapper?: HTMLElement;
  private structural?: MutationObserver;
  private active = false;
  private drawer: DrawerAdapter;
  private spacing = new SectionsSpacingAdapter();
  private tabs?: {element: HTMLElement & {withoutScrollControls: boolean}; original: boolean};
  constructor(readonly root: HassHost, private readonly changed: () => void) {
    this.drawer = new DrawerAdapter(root, changed);
    if (root.shadowRoot) {
      this.structural = new MutationObserver(records => {
        if (records.some(record => !(record.target as Element).closest?.(`#${STYLE_ID}`))) changed();
      });
      this.structural.observe(root.shadowRoot, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']});
    }
  }
  update(config: NavigationConfig, viewport: {width: number; dark: boolean; keyboard: boolean; escape: boolean}) {
    const native = nativeHeader(this.root);
    const enabled = config.enabled && !viewport.escape && (config.scope === 'all' || viewport.width <= MOBILE_MAX_WIDTH);
    if (!enabled || !native || !this.root.isConnected || native.wrapper.classList.contains('edit-mode') || this.root.lovelace?.editMode || hasBottomSections(native.view)) {
      this.restore();
      return;
    }
    const bounds = native.wrapper.getBoundingClientRect();
    const left = Math.max(0, bounds.left), right = Math.min(viewport.width, bounds.right);
    if (right - left < 180) { this.restore(); return; }
    if (!this.style?.isConnected) {
      this.style = this.root.ownerDocument.createElement('style');
      this.style.id = STYLE_ID;
      this.style.textContent = NAVIGATION_CSS;
      this.root.shadowRoot!.append(this.style);
    }
    this.root.setAttribute(ACTIVE, VERSION_MARKER);
    this.root.toggleAttribute('data-liquid-glass-opaque', config.reduce_transparency);
    this.root.toggleAttribute('data-liquid-glass-dark', viewport.dark);
    this.root.toggleAttribute('data-liquid-glass-keyboard', viewport.keyboard);
    this.setProperty('--lgn-left', `${Math.round(left * 100) / 100}px`);
    this.setProperty('--lgn-width', `${Math.round((right - left) * 100) / 100}px`);
    // Keep dashboard clearance stable while the bar morphs to/from the circle.
    if (!this.root.hasAttribute('data-liquid-glass-collapsed')) {
      this.setProperty('--lgn-height', `${Math.max(66, Math.ceil(native.header.getBoundingClientRect().height))}px`);
    }
    this.active = true;
    this.configureTabs(native.toolbar);
    this.spacing.update(native.view);
    const collapsed = this.drawer.update(native.header, native.toolbar.querySelector('ha-menu-button'), viewport);
    if (collapsed) {
      this.setProperty('--lgn-collapse-left', `${collapsed.left}px`);
      this.setProperty('--lgn-collapse-size', `${collapsed.size}px`);
    }
    this.root.toggleAttribute('data-liquid-glass-collapsed', Boolean(collapsed));
    if (this.measured !== native.header || this.wrapper !== native.wrapper) {
      this.resize?.disconnect();
      if (typeof ResizeObserver !== 'undefined') {
        this.resize = new ResizeObserver(this.changed);
        this.resize.observe(native.header);
        this.resize.observe(native.wrapper);
      }
      this.measured = native.header;
      this.wrapper = native.wrapper;
    }
  }
  private configureTabs(toolbar: HTMLElement) {
    const element = toolbar.querySelector<HTMLElement & {withoutScrollControls?: boolean}>('ha-tab-group');
    if (this.tabs?.element !== element) this.restoreTabs();
    // This public native property removes the controls and their reserved space.
    // CSS supplies a safe fallback while the custom element is still upgrading.
    if (!element || typeof element.withoutScrollControls !== 'boolean') return;
    if (!this.tabs) this.tabs = {element: element as HTMLElement & {withoutScrollControls: boolean}, original: element.withoutScrollControls};
    if (!element.withoutScrollControls) element.withoutScrollControls = true;
  }
  private restoreTabs() {
    // Do not overwrite a later external false assignment during cleanup.
    if (this.tabs?.element.withoutScrollControls === true) this.tabs.element.withoutScrollControls = this.tabs.original;
    this.tabs = undefined;
  }
  private setProperty(name: string, value: string) {
    if (this.root.style.getPropertyValue(name) !== value) this.root.style.setProperty(name, value);
  }
  restore() {
    this.drawer.restore();
    this.spacing.restore();
    this.restoreTabs();
    if (!this.active && !this.style) return;
    this.active = false;
    this.style?.remove(); this.style = undefined;
    this.resize?.disconnect(); this.resize = undefined; this.measured = undefined; this.wrapper = undefined;
    for (const attribute of OWNED_ATTRIBUTES) this.root.removeAttribute(attribute);
    for (const property of OWNED_PROPERTIES) this.root.style.removeProperty(property);
  }
  destroy() { this.restore(); this.structural?.disconnect(); this.drawer.destroy(); }
}
const VERSION_MARKER = '1';
