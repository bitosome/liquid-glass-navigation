import assert from 'node:assert/strict';
import {afterEach, beforeEach, test} from 'node:test';
import {Window} from 'happy-dom';
import {DrawerAdapter} from '../dist/drawer.js';

let win;
const adapters = [];
const owned = '[data-liquid-glass-drawer-control]';
beforeEach(() => {
  win = new Window({url: 'https://home.example/lovelace', width: 390, height: 844});
  for (const name of ['HTMLElement','Element','Node','MutationObserver','ResizeObserver']) globalThis[name] = win[name];
  // Synthetic Popover API stubs only: these tests do not prove top-layer rendering.
  win.HTMLElement.prototype.showPopover = function() { this._shown = true; };
  win.HTMLElement.prototype.hidePopover = function() { this._shown = false; };
});
afterEach(async () => {
  for (const adapter of adapters.splice(0)) adapter.destroy();
  await win.happyDOM.abort(); win.close();
});
const flush = async () => { await new Promise(setImmediate); };
function fixture({open = true, direction = 'ltr', width = 256, type = 'modal'} = {}) {
  const doc = win.document;
  const drawer = doc.createElement('ha-drawer');
  drawer.type = type; drawer.setAttribute('type', type);
  drawer.direction = direction; drawer.setAttribute('direction', direction);
  drawer.open = open; drawer.toggleAttribute('open', open); doc.body.append(drawer);
  const shadow = drawer.attachShadow({mode: 'open'});
  const wa = doc.createElement('wa-drawer'); wa.setAttribute('placement', 'start'); shadow.append(wa);
  const waShadow = wa.attachShadow({mode: 'open'});
  const dialog = doc.createElement('dialog'); dialog.setAttribute('part', 'dialog'); dialog.open = open; waShadow.append(dialog);
  const nativeBody = doc.createElement('div'); nativeBody.setAttribute('part', 'body'); dialog.append(nativeBody);
  Object.defineProperty(dialog, 'offsetWidth', {configurable: true, value: width});
  dialog.getBoundingClientRect = () => new win.DOMRect(direction === 'rtl' ? 390 - width : 0, 0, width, 844);
  const resolver = doc.createElement('partial-panel-resolver'); resolver.slot = 'appContent'; drawer.append(resolver);
  const root = doc.createElement('hui-root'); resolver.attachShadow({mode: 'open'}).append(root);
  const rootShadow = root.attachShadow({mode: 'open'});
  const header = doc.createElement('div'); header.className = 'header'; rootShadow.append(header);
  header.style.setProperty('--lgn-glass', 'rgba(20, 30, 40, 0.8)');
  header.style.setProperty('--lgn-opaque', 'rgb(20, 30, 40)');
  header.style.setProperty('--lgn-safe-bottom', '34px');
  const menu = doc.createElement('ha-menu-button'); header.append(menu);
  const menuIcon = doc.createElement('ha-icon-button'); menuIcon.label = 'Toggle sidebar'; menu.attachShadow({mode: 'open'}).append(menuIcon);
  let changed = 0;
  const adapter = new DrawerAdapter(root, () => { changed++; }); adapters.push(adapter);
  const update = (viewport = {}) => adapter.update(header, menu, {width: 390, keyboard: false, ...viewport});
  return {drawer, wa, dialog, nativeBody, root, header, menu, menuIcon, adapter, update, get changed() { return changed; }};
}

test('modal accessory stays inside the native dialog without reparenting controls or stealing focus', () => {
  const f = fixture();
  const focus = win.document.activeElement;
  const before = [...f.header.childNodes];
  assert.deepEqual(f.update(), {left: 268, size: 64});
  const popover = f.dialog.querySelector(owned);
  assert.equal(popover.parentElement, f.dialog);
  assert.equal(popover.getAttribute('popover'), 'manual'); assert.equal(popover._shown, true);
  assert.equal(popover.querySelector('[autofocus]'), null);
  assert.equal(popover.querySelector('button').getAttribute('aria-label'), 'Toggle sidebar');
  assert.deepEqual([...f.header.childNodes], before);
  assert.equal(f.nativeBody.parentElement, f.dialog);
  assert.equal(win.document.activeElement, focus);
  f.update(); assert.equal(f.dialog.querySelectorAll(owned).length, 1);
});

test('hamburger uses the native declarative close action and click bubbles to the native handler', () => {
  const f = fixture(); f.update(); let closed = 0;
  // Same descendant lookup as pinned WebAwesome's handleDialogClick.
  f.dialog.addEventListener('click', event => {
    const source = event.target.closest('[data-drawer="close"]');
    if (source) { closed++; f.dialog.open = false; }
  });
  const popover = f.dialog.querySelector(owned);
  assert.equal(popover.querySelector('button').getAttribute('data-drawer'), 'close');
  popover.querySelector('ha-icon').dispatchEvent(new win.MouseEvent('click', {bubbles: true, composed: true}));
  assert.equal(closed, 1); assert.equal(f.dialog.open, false);
  assert.equal(f.update(), undefined); assert.equal(f.dialog.querySelector(owned), null);
});

test('circle fits at 64, 56 or 44px without going offscreen, and falls back when no space remains', () => {
  const f = fixture();
  assert.deepEqual(f.update({width: 390}), {left: 268, size: 64});
  assert.deepEqual(f.update({width: 320}), {left: 260, size: 56});
  assert.deepEqual(f.update({width: 312}), {left: 260, size: 44});
  assert.equal(f.update({width: 300}), undefined); assert.equal(f.dialog.querySelector(owned), null);
  f.header.style.setProperty('--lgn-safe-right', '20px');
  assert.deepEqual(f.update({width: 340}), {left: 260, size: 56});
});

test('RTL places the circle beside the opposite final drawer edge and accounts for safe area', () => {
  const f = fixture({direction: 'rtl'});
  assert.deepEqual(f.update(), {left: 58, size: 64});
  f.header.style.setProperty('--lgn-safe-left', '60px');
  assert.deepEqual(f.update(), {left: 74, size: 56});
  assert.equal(f.dialog.querySelector(owned).style.left, '74px');
});

test('closed modal is observed; show lifecycle waits until the native dialog has actually opened', async () => {
  const f = fixture({open: false});
  assert.equal(f.update(), undefined);
  f.wa.dispatchEvent(new win.Event('wa-show', {bubbles: true, composed: true}));
  assert.equal(f.dialog.querySelector(owned), null);
  f.drawer.open = true; f.drawer.setAttribute('open', ''); f.dialog.open = true;
  await flush(); assert.ok(f.changed > 0);
  assert.deepEqual(f.update(), {left: 268, size: 64});
});

test('canceled hide and active native closing animation keep the accessory until actual closure', async () => {
  const f = fixture(); f.update();
  f.wa.addEventListener('wa-hide', event => event.preventDefault());
  f.wa.dispatchEvent(new win.Event('wa-hide', {bubbles: true, composed: true, cancelable: true}));
  await flush(); assert.ok(f.dialog.querySelector(owned));
  f.drawer.open = false; f.drawer.removeAttribute('open');
  assert.deepEqual(f.update(), {left: 268, size: 64});
  f.dialog.open = false; f.wa.dispatchEvent(new win.Event('wa-after-hide', {bubbles: true, composed: true}));
  await flush(); assert.equal(f.dialog.querySelector(owned), null);
});

test('nonmodal, missing native menu, virtual keyboard and unsupported Popover API leave native UI alone', () => {
  const f = fixture({type: ''});
  assert.equal(f.update(), undefined);
  f.drawer.type = 'modal'; f.drawer.setAttribute('type', 'modal');
  f.menuIcon.remove(); assert.equal(f.update(), undefined);
  f.menu.shadowRoot.append(f.menuIcon); assert.equal(f.update({keyboard: true}), undefined);
  win.HTMLElement.prototype.showPopover = undefined;
  assert.equal(f.update(), undefined); assert.equal(f.dialog.querySelector(owned), null);
  assert.equal(f.dialog.open, true); assert.equal(f.header.contains(f.menu), true);
});

test('native drawer shape changes and unavailable geometry fail safely', () => {
  const f = fixture(); f.wa.setAttribute('placement', 'end'); assert.equal(f.update(), undefined);
  f.wa.setAttribute('placement', 'start');
  Object.defineProperty(f.dialog, 'offsetWidth', {value: 0});
  f.dialog.getBoundingClientRect = () => new win.DOMRect();
  assert.equal(f.update(), undefined);
  assert.equal(f.dialog.open, true);
});

test('appearance copies current glass tokens and updates opaque preference without recreating the accessory', () => {
  const f = fixture(); f.root.setAttribute('data-liquid-glass-opaque', ''); f.update();
  const popover = f.dialog.querySelector(owned);
  assert.equal(popover.style.getPropertyValue('--lgn-glass'), 'rgba(20, 30, 40, 0.8)');
  assert.equal(popover.style.getPropertyValue('--lgn-safe-bottom'), '34px');
  assert.equal(popover.hasAttribute('data-opaque'), true);
  f.root.removeAttribute('data-liquid-glass-opaque'); f.header.style.setProperty('--lgn-glass', 'white'); f.update();
  assert.equal(f.dialog.querySelector(owned), popover);
  assert.equal(popover.style.getPropertyValue('--lgn-glass'), 'white'); assert.equal(popover.hasAttribute('data-opaque'), false);
});

test('restore removes only owned content and observers and never closes the native drawer', async () => {
  const f = fixture(); f.update(); const popover = f.dialog.querySelector(owned);
  f.adapter.restore(); await flush(); const count = f.changed;
  assert.equal(popover._shown, false); assert.equal(f.dialog.querySelector(owned), null);
  assert.equal(f.dialog.open, true); assert.equal(f.nativeBody.parentElement, f.dialog);
  f.drawer.removeAttribute('open'); f.wa.dispatchEvent(new win.Event('wa-after-show')); await flush();
  assert.equal(f.changed, count);
  assert.deepEqual(f.update(), {left: 268, size: 64});
});

test('replaced or externally removed owned popup is recreated without duplicating native nodes', () => {
  const f = fixture(); f.update(); f.dialog.querySelector(owned).remove();
  assert.deepEqual(f.update(), {left: 268, size: 64});
  assert.equal(f.dialog.querySelectorAll(owned).length, 1); assert.equal(f.dialog.querySelectorAll('[part="body"]').length, 1);
  f.root.remove(); assert.equal(f.update(), undefined); assert.equal(f.dialog.querySelector(owned), null);
});
