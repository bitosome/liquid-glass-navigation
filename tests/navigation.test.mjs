import assert from 'node:assert/strict';
import {afterEach, beforeEach, test} from 'node:test';
import {Window} from 'happy-dom';
import {HeaderAdapter, hasBottomSections, nativeHeader} from '../dist/adapter.js';
import {NavigationController, discoverShell, focusedEditor} from '../dist/controller.js';
import {DISABLED, parseConfig} from '../dist/types.js';

let win;
const cleanups = [];
const enabled = {enabled: true, scope: 'mobile', reduce_transparency: false, version: '0.1.0'};
const viewport = {width: 390, dark: false, keyboard: false, escape: false};
const active = root => root.hasAttribute('data-liquid-glass-navigation');
const ownStyle = root => root.shadowRoot.querySelector('#liquid-glass-navigation-style');

beforeEach(() => {
  win = new Window({url: 'https://home.example/lovelace/overview', width: 390, height: 844});
  for (const name of ['window', 'document', 'HTMLElement', 'Element', 'HTMLInputElement', 'MutationObserver', 'ResizeObserver', 'Node']) {
    Object.defineProperty(globalThis, name, {configurable: true, writable: true, value: name === 'window' ? win : name === 'document' ? win.document : win[name]});
  }
});
afterEach(async () => {
  while (cleanups.length) cleanups.pop()();
  await win.happyDOM.abort();
  win.close();
});

function rect(element, left = 0, width = 390, height = 64) {
  element.getBoundingClientRect = () => new win.DOMRect(left, 0, width, height);
}
function makeRoot({title = false, parent = win.document.body} = {}) {
  const root = win.document.createElement('hui-root');
  const shadow = root.attachShadow({mode: 'open'});
  shadow.innerHTML = `<div class="narrow"><div class="header"><slot name="toolbar"><div class="toolbar"><ha-menu-button slot="navigationIcon"></ha-menu-button>${title ? '<div class="main-title">Room</div>' : `<ha-tab-group><ha-tab-group-tab slot="nav" panel="0" data-path="overview" active aria-selected="true" aria-label="Overview"><ha-icon icon="mdi:home"></ha-icon></ha-tab-group-tab><ha-tab-group-tab slot="nav" panel="1" data-path="energy" aria-label="Energy">Energy</ha-tab-group-tab><ha-tab-group-tab slot="nav" panel="2" data-path="hidden" class="hide-tab" disabled aria-label="Hidden">Hidden</ha-tab-group-tab></ha-tab-group>`}<div class="action-items"><ha-dropdown><ha-icon-button id="dashboardmenu" slot="trigger"></ha-icon-button></ha-dropdown></div></div></slot></div><hui-view-container id="view"><hui-view-background><hui-view></hui-view></hui-view-background></hui-view-container></div>`;
  root.lovelace = {editMode: false};
  parent.append(root);
  const native = nativeHeader(root);
  assert.ok(native, 'synthetic fixture must match the supported native structure');
  rect(native.wrapper); rect(native.header);
  return {root, ...native};
}
function adapterFor(root) {
  const adapter = new HeaderAdapter(root, () => {});
  cleanups.push(() => adapter.destroy());
  return adapter;
}
function makeConnection({pending = false, reject = false, rejectUnsubscribe = false} = {}) {
  const callbacks = [];
  const messages = [];
  const options = [];
  const listeners = new Map();
  const listenerArrays = new Map();
  const pendingResolvers = [];
  let unsubscribed = 0;
  const unsubscribe = () => {
    unsubscribed++;
    if (rejectUnsubscribe) return Promise.reject(new Error('socket closed before unsubscribe'));
  };
  const connection = {
    subscribeMessage(callback, message, subscriptionOptions) {
      callbacks.push(callback); messages.push(message); options.push(subscriptionOptions);
      if (reject) return Promise.reject(new Error('subscription unavailable'));
      if (pending) return new Promise(done => { pendingResolvers.push(done); });
      return Promise.resolve(unsubscribe);
    },
    addEventListener(type, callback) {
      listeners.set(type, callback);
      if (!listenerArrays.has(type)) listenerArrays.set(type, []);
      listenerArrays.get(type).push(callback);
    },
    removeEventListener(type, callback) {
      if (listeners.get(type) === callback) listeners.delete(type);
      const callbacks = listenerArrays.get(type);
      const index = callbacks?.indexOf(callback) ?? -1;
      if (index >= 0) callbacks.splice(index, 1);
    },
  };
  return {
    connection, callbacks, messages, options, listeners, listenerArrays,
    emit(value, index = callbacks.length - 1) { callbacks[index](value); },
    // HA dispatches its actual listener array, rather than a copied snapshot.
    event(type) { for (const callback of listenerArrays.get(type) ?? []) callback(); },
    settle() { pendingResolvers.shift()(unsubscribe); },
    get unsubscribed() { return unsubscribed; },
  };
}
function makeApp(connection) {
  const app = win.document.createElement('home-assistant');
  app.hass = {connection, themes: {darkMode: false}};
  win.document.body.append(app);
  let scope = app.attachShadow({mode: 'open'});
  for (const tag of ['home-assistant-main', 'partial-panel-resolver', 'ha-panel-lovelace']) {
    const host = win.document.createElement(tag);
    scope.append(host);
    scope = host.attachShadow({mode: 'open'});
  }
  return {app, ...makeRoot({parent: scope})};
}
function controllerFor() {
  const controller = new NavigationController(win.document, win);
  cleanups.push(() => controller.stop());
  controller.start();
  return controller;
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

// These are DOM/interaction tests, not rendered-browser or visual assertions.
test('configuration parser fails closed and preserves valid server options', () => {
  assert.deepEqual(parseConfig({...enabled, scope: 'all', reduce_transparency: true}), {...enabled, scope: 'all', reduce_transparency: true});
  for (const invalid of [undefined, null, [], true, {}, {...enabled, enabled: 'true'}, {...enabled, scope: 'tablet'}, {...enabled, reduce_transparency: 'false'}, {...enabled, version: 1}]) {
    assert.deepEqual(parseConfig(invalid), DISABLED);
  }
});

test('recognizes the exact native tab header and native single-view/back title header', () => {
  const tabs = makeRoot();
  assert.equal(nativeHeader(tabs.root).toolbar, tabs.toolbar);
  const single = makeRoot({title: true});
  single.toolbar.querySelector('ha-menu-button').replaceWith(win.document.createElement('ha-icon-button-arrow-prev'));
  assert.equal(nativeHeader(single.root).header, single.header);
});

test('unsupported or externally replaced toolbars retain stock navigation', () => {
  const cases = [
    f => f.toolbar.querySelector('.action-items').remove(),
    f => f.toolbar.querySelector('ha-tab-group-tab').replaceWith(Object.assign(win.document.createElement('paper-tab'), {slot: 'nav'})),
    f => f.toolbar.querySelector('ha-tab-group').replaceChildren(),
    f => f.header.append(f.toolbar),
    f => { const outer = win.document.createElement('section'); f.root.shadowRoot.append(outer); outer.append(f.wrapper); },
    f => { const replacement = win.document.createElement('div'); replacement.slot = 'toolbar'; f.root.append(replacement); },
  ];
  for (const change of cases) {
    const fixture = makeRoot(); change(fixture);
    assert.equal(nativeHeader(fixture.root), undefined);
    adapterFor(fixture.root).update(enabled, viewport);
    assert.equal(active(fixture.root), false);
    assert.equal(ownStyle(fixture.root), null);
  }
});

test('repositioning preserves actual native nodes, click handlers, visibility and order', () => {
  const {root, header, toolbar} = makeRoot();
  const tabs = [...toolbar.querySelectorAll('ha-tab-group-tab')];
  const menu = toolbar.querySelector('ha-menu-button');
  const overflow = toolbar.querySelector('#dashboardmenu');
  const received = [];
  for (const [name, node] of [['tab', tabs[0]], ['menu', menu], ['overflow', overflow]]) node.addEventListener('click', () => received.push(name));
  const adapter = adapterFor(root);
  adapter.update(enabled, viewport);
  adapter.update(enabled, viewport);
  assert.equal(nativeHeader(root).header, header);
  assert.deepEqual([...toolbar.querySelectorAll('ha-tab-group-tab')], tabs);
  assert.equal(root.shadowRoot.querySelectorAll('.header').length, 1);
  assert.equal(root.shadowRoot.querySelectorAll('#liquid-glass-navigation-style').length, 1);
  assert.equal(tabs[2].className, 'hide-tab');
  assert.equal(tabs[2].hasAttribute('disabled'), true);
  tabs[0].click(); menu.click(); overflow.click();
  assert.deepEqual(received, ['tab', 'menu', 'overflow']);
  // Reorder with the native DOM as HA would: there is no cached parallel list.
  tabs[0].parentElement.prepend(tabs[1]);
  adapter.update(enabled, viewport);
  assert.equal(toolbar.querySelector('ha-tab-group-tab'), tabs[1]);
  adapter.restore();
  assert.equal(nativeHeader(root).header, header);
  tabs[0].click();
  assert.deepEqual(received, ['tab', 'menu', 'overflow', 'tab']);
});

test('mobile scope restores stock above breakpoint; all scope honors sidebar content bounds', () => {
  const {root, wrapper, header} = makeRoot();
  const adapter = adapterFor(root);
  adapter.update(enabled, {...viewport, width: 767}); assert.equal(active(root), true);
  adapter.update(enabled, {...viewport, width: 768}); assert.equal(active(root), false);
  rect(wrapper, 256, 1100, 800); rect(header, 256, 760, 66.2);
  adapter.update({...enabled, scope: 'all'}, {...viewport, width: 1200});
  assert.equal(active(root), true);
  assert.equal(root.style.getPropertyValue('--lgn-left'), '256px');
  assert.equal(root.style.getPropertyValue('--lgn-width'), '944px');
  assert.equal(root.style.getPropertyValue('--lgn-height'), '67px');
});

test('disabled configuration, recovery escape and too-narrow content restore the native header', () => {
  const {root, wrapper} = makeRoot();
  const adapter = adapterFor(root);
  for (const stop of [() => adapter.update(DISABLED, viewport), () => adapter.update(enabled, {...viewport, escape: true}), () => { rect(wrapper, 0, 179); adapter.update(enabled, viewport); }]) {
    rect(wrapper); adapter.update(enabled, viewport); assert.equal(active(root), true);
    stop(); assert.equal(active(root), false); assert.equal(ownStyle(root), null);
  }
});

test('both native edit-mode signals restore the unchanged stock editor immediately', () => {
  const {root, wrapper, header} = makeRoot();
  const adapter = adapterFor(root);
  adapter.update(enabled, viewport);
  wrapper.classList.add('edit-mode'); adapter.update(enabled, viewport);
  assert.equal(active(root), false); assert.equal(nativeHeader(root).header, header);
  wrapper.classList.remove('edit-mode'); adapter.update(enabled, viewport); assert.equal(active(root), true);
  root.lovelace.editMode = true; adapter.update(enabled, viewport); assert.equal(active(root), false);
  root.lovelace.editMode = false; adapter.update(enabled, viewport); assert.equal(active(root), true);
});

test('lost native structure or detached root removes the skin without deleting HA elements', () => {
  const {root, toolbar, header} = makeRoot();
  const adapter = adapterFor(root);
  adapter.update(enabled, viewport);
  const actions = toolbar.querySelector('.action-items'); actions.remove();
  adapter.update(enabled, viewport); assert.equal(active(root), false); assert.equal(header.isConnected, true);
  toolbar.append(actions); adapter.update(enabled, viewport); assert.equal(active(root), true);
  root.remove(); adapter.update(enabled, viewport); assert.equal(active(root), false); assert.equal(ownStyle(root), null);
});

test('native sections bottom switcher collision falls back to top navigation', () => {
  const {root, view} = makeRoot();
  const inner = view.querySelector('hui-view').attachShadow({mode: 'open'});
  const sections = win.document.createElement('hui-sections-view'); inner.append(sections);
  const sectionShadow = sections.attachShadow({mode: 'open'});
  sectionShadow.innerHTML = '<div class="wrapper has-sidebar-tabs"><div class="sidebar-tabs"></div></div>';
  assert.equal(hasBottomSections(view), true);
  const adapter = adapterFor(root); adapter.update(enabled, viewport); assert.equal(active(root), false);
  sectionShadow.querySelector('.wrapper').classList.remove('has-sidebar-tabs');
  assert.equal(hasBottomSections(view), false);
  adapter.update(enabled, viewport); assert.equal(active(root), true);
});

test('appearance and keyboard options apply only to the owned root and clean up reversibly', () => {
  const {root} = makeRoot();
  const other = makeRoot().root;
  const foreignStyle = win.document.createElement('style'); foreignStyle.id = 'card-mod-owned';
  foreignStyle.textContent = ':host { --example-theme: blue; }'; root.shadowRoot.append(foreignStyle);
  root.setAttribute('data-example', 'keep'); root.style.setProperty('--example-theme', 'blue');
  const adapter = adapterFor(root);
  adapter.update({...enabled, reduce_transparency: true}, {...viewport, dark: true, keyboard: true});
  assert.equal(root.hasAttribute('data-liquid-glass-opaque'), true);
  assert.equal(root.hasAttribute('data-liquid-glass-dark'), true);
  assert.equal(root.hasAttribute('data-liquid-glass-keyboard'), true);
  assert.equal(active(other), false); assert.equal(ownStyle(other), null);
  assert.equal(win.document.head.querySelector('style'), null);
  adapter.update(enabled, viewport);
  for (const name of ['opaque', 'dark', 'keyboard']) assert.equal(root.hasAttribute(`data-liquid-glass-${name}`), false);
  adapter.destroy();
  assert.equal(root.getAttribute('data-example'), 'keep');
  assert.equal(root.style.getPropertyValue('--example-theme'), 'blue');
  assert.equal(root.shadowRoot.querySelector('#card-mod-owned'), foreignStyle);
  assert.equal(ownStyle(root), null);
});

test('shell discovery enters only HA shell shadows and leaves custom card trees alone', () => {
  const {root} = makeApp(undefined);
  const card = win.document.createElement('some-custom-card');
  win.document.body.append(card);
  const fakeRoot = makeRoot({parent: card.attachShadow({mode: 'open'})}).root;
  const discovered = discoverShell(win.document);
  assert.deepEqual([...discovered.roots], [root]);
  assert.equal(discovered.scopes.has(fakeRoot.shadowRoot), false);
  assert.equal(discovered.scopes.has(root.shadowRoot), false);
});

test('controller waits for authenticated shared config, applies live options, and restores on unload', async () => {
  const socket = makeConnection(); const {root} = makeApp(socket.connection);
  const controller = controllerFor();
  assert.equal(active(root), false);
  assert.deepEqual(socket.messages, [{type: 'liquid_glass_navigation/subscribe'}]);
  socket.emit(enabled); assert.equal(active(root), true);
  socket.emit({...enabled, reduce_transparency: true}); assert.equal(root.hasAttribute('data-liquid-glass-opaque'), true);
  await settle(); controller.reconcile(); assert.equal(socket.messages.length, 1);
  socket.emit({...enabled, enabled: false});
  assert.equal(active(root), false); assert.equal(ownStyle(root), null);
  socket.emit(enabled); assert.equal(active(root), true);
  controller.stop();
  assert.equal(active(root), false); assert.equal(socket.unsubscribed, 1); assert.equal(socket.listeners.size, 0);
  socket.emit(enabled); assert.equal(active(root), false);
});

test('disabled or malformed server options restore even when the document is hidden', async () => {
  const socket = makeConnection(); const {root} = makeApp(socket.connection);
  controllerFor(); await settle(); socket.emit(enabled);
  Object.defineProperty(win.document, 'hidden', {configurable: true, value: true});
  socket.emit({...enabled, enabled: false}); assert.equal(active(root), false);
  socket.emit(enabled); assert.equal(active(root), true);
  socket.emit({enabled: true}); assert.equal(active(root), false);
});

test('controller scope options and URL escape change without rewriting dashboard configuration', async () => {
  const socket = makeConnection(); const {root} = makeApp(socket.connection);
  const originalLovelace = root.lovelace;
  const controller = controllerFor(); await settle();
  win.happyDOM.setWindowSize({width: 1000, height: 844});
  socket.emit(enabled); assert.equal(active(root), false);
  socket.emit({...enabled, scope: 'all'}); assert.equal(active(root), true);
  win.history.replaceState(null, '', '/lovelace/overview?liquid_glass=off'); controller.reconcile();
  assert.equal(active(root), false);
  win.history.replaceState(null, '', '/lovelace/energy'); controller.reconcile(); assert.equal(active(root), true);
  assert.equal(root.lovelace, originalLovelace);
});

test('connection replacement removes old listener/subscription and ignores late old events', async () => {
  const first = makeConnection(); const second = makeConnection();
  const {app, root} = makeApp(first.connection); const controller = controllerFor(); await settle();
  first.emit(enabled); assert.equal(active(root), true);
  app.hass.connection = second.connection; controller.reconcile(); await settle();
  assert.equal(active(root), false); assert.equal(first.unsubscribed, 1); assert.equal(first.listeners.size, 0);
  first.emit(enabled); assert.equal(active(root), false);
  second.emit(enabled); assert.equal(active(root), true);
  first.emit(DISABLED); assert.equal(active(root), true);
  controller.stop(); assert.equal(second.unsubscribed, 1); assert.equal(second.listeners.size, 0);
});

test('a pending old subscription is disposed after connection replacement', async () => {
  const first = makeConnection({pending: true}); const second = makeConnection();
  const {app, root} = makeApp(first.connection); const controller = controllerFor();
  app.hass.connection = second.connection; controller.reconcile(); await settle();
  second.emit(enabled); assert.equal(active(root), true);
  first.settle(); await settle(); assert.equal(first.unsubscribed, 1);
  first.emit(DISABLED); assert.equal(active(root), true);
});

test('a pending subscription cannot resurrect the skin after controller stop', async () => {
  const socket = makeConnection({pending: true}); const {root} = makeApp(socket.connection);
  const controller = controllerFor(); socket.emit(enabled); assert.equal(active(root), true);
  controller.stop(); socket.settle(); await settle();
  assert.equal(socket.unsubscribed, 1); assert.equal(active(root), false);
  socket.emit(enabled); assert.equal(active(root), false);
});

test('subscription failure leaves stock header and does not retry every reconciliation', async () => {
  const socket = makeConnection({reject: true}); const {root} = makeApp(socket.connection);
  const controller = controllerFor(); await settle();
  assert.equal(active(root), false);
  controller.reconcile(); controller.reconcile();
  assert.equal(socket.messages.length, 1);
  controller.stop(); assert.equal(socket.listeners.size, 0);
});

test('disconnection and removed dashboard roots immediately lose owned styles', async () => {
  const socket = makeConnection(); const {root} = makeApp(socket.connection);
  const controller = controllerFor(); await settle(); socket.emit(enabled);
  socket.listeners.get('disconnected')(); assert.equal(active(root), false);
  socket.emit(enabled); assert.equal(active(root), true);
  root.remove(); controller.reconcile();
  assert.equal(active(root), false); assert.equal(ownStyle(root), null);
});

test('late HA shell creation is picked up and repeated start does not duplicate subscriptions', async () => {
  const controller = controllerFor(); const socket = makeConnection(); const {root} = makeApp(socket.connection);
  controller.start(); controller.reconcile(); await settle(); socket.emit(enabled);
  assert.equal(active(root), true); assert.equal(socket.messages.length, 1);
  controller.start(); controller.reconcile(); assert.equal(socket.messages.length, 1);
});

test('deep text editing plus a substantially smaller visual viewport identifies keyboard, not every resize', async () => {
  const socket = makeConnection(); const {root, view} = makeApp(socket.connection);
  const input = win.document.createElement('input'); input.type = 'text'; view.append(input);
  const visualViewport = new win.EventTarget(); visualViewport.height = 844;
  Object.defineProperty(win, 'visualViewport', {configurable: true, value: visualViewport});
  const controller = controllerFor(); await settle(); socket.emit(enabled);
  input.focus(); assert.equal(focusedEditor(win.document), true);
  visualViewport.height = 760; controller.reconcile(); assert.equal(root.hasAttribute('data-liquid-glass-keyboard'), false);
  visualViewport.height = 400; controller.reconcile(); assert.equal(root.hasAttribute('data-liquid-glass-keyboard'), true);
  input.blur(); controller.reconcile(); assert.equal(root.hasAttribute('data-liquid-glass-keyboard'), false);
  input.type = 'checkbox'; input.focus(); assert.equal(focusedEditor(win.document), false);
});


test('ready recovery disables library resubscription and leaves sibling ready listeners untouched', async () => {
  const socket = makeConnection(); const {root} = makeApp(socket.connection);
  const controller = controllerFor(); await settle(); socket.emit(enabled);
  let siblingCalls = 0;
  const sibling = () => { siblingCalls++; };
  socket.connection.addEventListener('ready', sibling);
  assert.deepEqual(socket.options, [{resubscribe: false}]);
  socket.event('disconnected'); assert.equal(active(root), false);
  socket.event('ready'); socket.event('ready');
  // No mutation of the live listener list or duplicate subscribe during dispatch.
  assert.equal(siblingCalls, 2);
  assert.equal(socket.messages.length, 1);
  assert.equal(socket.unsubscribed, 0);
  await settle();
  assert.equal(socket.messages.length, 2);
  assert.equal(socket.unsubscribed, 1);
  assert.deepEqual(socket.options, [{resubscribe: false}, {resubscribe: false}]);
  socket.emit(enabled, 0); assert.equal(active(root), false);
  socket.emit(enabled, 1); assert.equal(active(root), true);
  socket.emit(DISABLED, 0); assert.equal(active(root), true);
  assert.equal(socket.listenerArrays.get('ready').length, 2);
  controller.stop(); assert.equal(socket.unsubscribed, 2);
  assert.deepEqual(socket.listenerArrays.get('ready'), [sibling]);
  socket.connection.removeEventListener('ready', sibling);
});

test('queued ready recovery from a replaced connection cannot reconnect either socket', async () => {
  const first = makeConnection(); const second = makeConnection();
  const {app, root} = makeApp(first.connection); const controller = controllerFor(); await settle();
  first.emit(enabled); first.event('ready');
  app.hass.connection = second.connection; controller.reconcile(); await settle();
  assert.equal(first.messages.length, 1); assert.equal(first.unsubscribed, 1);
  assert.equal(second.messages.length, 1); assert.equal(active(root), false);
  second.emit(enabled); assert.equal(active(root), true);
  first.emit(DISABLED); assert.equal(active(root), true);
});

test('a removed old ready listener invoked after replacement cannot restart the new subscription', async () => {
  const first = makeConnection(); const second = makeConnection();
  const {app, root} = makeApp(first.connection); const controller = controllerFor(); await settle();
  const staleReady = first.listeners.get('ready');
  app.hass.connection = second.connection; controller.reconcile(); await settle();
  second.emit(enabled); assert.equal(active(root), true);
  staleReady(); await settle();
  assert.equal(second.messages.length, 1);
  assert.equal(second.unsubscribed, 0);
  assert.equal(active(root), true);
});

test('ready queued before stop cannot start a new subscription afterward', async () => {
  const socket = makeConnection(); const {root} = makeApp(socket.connection);
  const controller = controllerFor(); await settle(); socket.emit(enabled);
  const staleReady = socket.listeners.get('ready');
  socket.event('ready'); controller.stop(); staleReady(); await settle();
  assert.equal(socket.messages.length, 1); assert.equal(socket.unsubscribed, 1);
  assert.equal(active(root), false); assert.equal(socket.listeners.size, 0);
});

test('asynchronous unsubscribe rejection during stop is contained and cleanup completes', async () => {
  const socket = makeConnection({rejectUnsubscribe: true}); const {root} = makeApp(socket.connection);
  const controller = controllerFor(); await settle(); socket.emit(enabled);
  controller.stop();
  // Cross a turn so an unhandled rejection would fail the Node test runner.
  await new Promise(setImmediate);
  assert.equal(socket.unsubscribed, 1); assert.equal(socket.listeners.size, 0);
  assert.equal(active(root), false); assert.equal(ownStyle(root), null);
});

test('asynchronous unsubscribe rejection from a stopped pending subscription is contained', async () => {
  const socket = makeConnection({pending: true, rejectUnsubscribe: true}); const {root} = makeApp(socket.connection);
  const controller = controllerFor(); socket.emit(enabled); controller.stop();
  socket.settle(); await settle(); await new Promise(setImmediate);
  assert.equal(socket.unsubscribed, 1); assert.equal(active(root), false);
  socket.emit(enabled); assert.equal(active(root), false);
});

test('asynchronous unsubscribe rejection from a replaced pending subscription cannot disrupt its replacement', async () => {
  const first = makeConnection({pending: true, rejectUnsubscribe: true}); const second = makeConnection();
  const {app, root} = makeApp(first.connection); const controller = controllerFor();
  app.hass.connection = second.connection; controller.reconcile(); await settle(); second.emit(enabled);
  first.settle(); await settle(); await new Promise(setImmediate);
  assert.equal(first.unsubscribed, 1); assert.equal(second.unsubscribed, 0); assert.equal(active(root), true);
  first.emit(DISABLED); assert.equal(active(root), true);
});


test('a removed old disconnected listener cannot disable navigation on the replacement connection', async () => {
  const first = makeConnection(); const second = makeConnection();
  const {app, root} = makeApp(first.connection); const controller = controllerFor(); await settle();
  const staleDisconnected = first.listeners.get('disconnected');
  app.hass.connection = second.connection; controller.reconcile(); await settle(); second.emit(enabled);
  staleDisconnected(); await settle();
  assert.equal(active(root), true); assert.equal(second.messages.length, 1);
  controller.stop(); staleDisconnected(); assert.equal(active(root), false);
});
