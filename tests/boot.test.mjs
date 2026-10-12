import assert from 'node:assert/strict';
import {afterEach, beforeEach, test} from 'node:test';
import {Window} from 'happy-dom';
import {VERSION} from '../dist/types.js';

const key = Symbol.for('liquid-glass-navigation.controller');
let win;
let evaluation = 0;
beforeEach(() => {
  win = new Window({url: 'https://home.example/lovelace', width: 390, height: 844});
  for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'MutationObserver', 'ResizeObserver']) {
    Object.defineProperty(globalThis, name, {configurable: true, writable: true, value: name === 'window' ? win : name === 'document' ? win.document : win[name]});
  }
});
afterEach(async () => {
  win[key]?.controller.stop();
  await win.happyDOM.abort(); win.close();
});

function shell() {
  let unsubscribed = 0;
  const messages = [];
  const listeners = new Map();
  const app = win.document.createElement('home-assistant');
  app.hass = {connection: {
    subscribeMessage(callback, message, options) {
      messages.push({callback, message, options});
      return Promise.resolve(() => { unsubscribed++; });
    },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
  }};
  win.document.body.append(app);
  return {messages, listeners, get unsubscribed() { return unsubscribed; }};
}
async function evaluateNewModuleIdentity() {
  // Re-evaluate the real ES module without a browser or a network request.
  const url = new URL('../dist/index.js', import.meta.url);
  url.searchParams.set('boot-test', String(++evaluation));
  await import(url.href);
  await Promise.resolve();
}

test('real module bootstrap stops stale 0.1.0 controller and replaces it with the current version', async () => {
  assert.notEqual(VERSION, '0.1.0', 'the deployed update must have a new runtime identity');
  const socket = shell();
  let oldStops = 0;
  const previous = {version: '0.1.0', controller: {stop() { oldStops++; }}};
  win[key] = previous;
  await evaluateNewModuleIdentity();
  assert.equal(oldStops, 1);
  assert.notEqual(win[key], previous);
  assert.equal(win[key].version, VERSION);
  assert.equal(typeof win[key].controller.stop, 'function');
  assert.equal(socket.messages.length, 1);
  assert.deepEqual(socket.messages[0].message, {type: 'liquid_glass_navigation/subscribe'});
  assert.deepEqual(socket.messages[0].options, {resubscribe: false});
});

test('a second module URL with the same version reuses the running controller without duplicate start', async () => {
  const socket = shell();
  await evaluateNewModuleIdentity();
  const first = win[key];
  await evaluateNewModuleIdentity();
  assert.equal(win[key], first);
  assert.equal(win[key].version, VERSION);
  assert.equal(socket.messages.length, 1);
  assert.equal(socket.unsubscribed, 0);
  assert.equal(socket.listeners.size, 2);
});

test('bootstrapped controller shuts down its live subscription and listeners cleanly', async () => {
  const socket = shell();
  await evaluateNewModuleIdentity();
  win[key].controller.stop();
  assert.equal(socket.unsubscribed, 1);
  assert.equal(socket.listeners.size, 0);
  win[key].controller.stop();
  assert.equal(socket.unsubscribed, 1);
  // A disconnected source cannot restart it through a captured configuration callback.
  socket.messages[0].callback({enabled: true, scope: 'mobile', reduce_transparency: false, version: VERSION});
  await Promise.resolve();
  assert.equal(socket.messages.length, 1);
});
