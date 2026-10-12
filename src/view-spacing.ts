import {SECTIONS_SPACING_CSS} from './styles.js';

const ACTIVE = 'data-liquid-glass-sections';
const STYLE_ID = 'liquid-glass-sections-spacing-style';

/** Compact only the unused top gutter. Never cross into arbitrary card shadows. */
export class SectionsSpacingAdapter {
  private styles = new Map<HTMLElement, HTMLStyleElement>();

  update(view: HTMLElement) {
    const current = new Set<HTMLElement>();
    // HA's hui-view uses light DOM and owns the native layout as a direct child.
    for (const host of view.querySelectorAll<HTMLElement>('hui-view > hui-sections-view')) {
      const shadow = host.shadowRoot;
      const wrapper = shadow?.querySelector<HTMLElement>('.wrapper');
      const header = wrapper?.querySelector<HTMLElement>(':scope > hui-view-header');
      const container = header?.nextElementSibling;
      if (!host.isConnected || !shadow || wrapper?.parentNode !== shadow || !container?.classList.contains('container')) continue;
      current.add(host);
      host.setAttribute(ACTIVE, '');
      let style = this.styles.get(host);
      if (!style?.isConnected) {
        style = host.ownerDocument.createElement('style');
        style.id = STYLE_ID;
        style.textContent = SECTIONS_SPACING_CSS;
        shadow.append(style);
        this.styles.set(host, style);
      }
    }
    for (const [host, style] of this.styles) {
      if (!current.has(host)) {
        style.remove(); host.removeAttribute(ACTIVE); this.styles.delete(host);
      }
    }
  }

  restore() {
    for (const [host, style] of this.styles) {
      style.remove(); host.removeAttribute(ACTIVE);
    }
    this.styles.clear();
  }
}
