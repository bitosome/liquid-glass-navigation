import assert from 'node:assert/strict';
import {afterEach, beforeEach, test} from 'node:test';
import {Window} from 'happy-dom';
import {HeaderAdapter, nativeHeader} from '../dist/adapter.js';
import {SectionsSpacingAdapter} from '../dist/view-spacing.js';
import {DISABLED, VERSION} from '../dist/types.js';

let win;
const cleanups = [];
const STYLE_ID = 'liquid-glass-sections-spacing-style';
const ACTIVE = 'data-liquid-glass-sections';
const enabled = {enabled: true, scope: 'mobile', reduce_transparency: false, version: VERSION};
const viewport = {width: 390, dark: false, keyboard: false, escape: false};

beforeEach(() => {
  win = new Window({url: 'https://home.example/lovelace/overview', width: 390, height: 844});
  for (const name of ['window', 'document', 'HTMLElement', 'Element', 'MutationObserver', 'ResizeObserver', 'Node', 'ShadowRoot']) {
    Object.defineProperty(globalThis, name, {configurable: true, writable: true, value: name === 'window' ? win : name === 'document' ? win.document : win[name]});
  }
});
afterEach(async () => {
  while (cleanups.length) cleanups.pop()();
  await win.happyDOM.abort();
  win.close();
});

function makeSections(parent) {
  const sections = win.document.createElement('hui-sections-view');
  const shadow = sections.attachShadow({mode: 'open'});
  shadow.innerHTML = '<div class="wrapper"><hui-view-header></hui-view-header><div class="container"><hui-section><hui-card></hui-card></hui-section></div></div>';
  parent.append(sections);
  return {sections, shadow, wrapper: shadow.querySelector('.wrapper'), header: shadow.querySelector('hui-view-header'), container: shadow.querySelector('.container')};
}
function makeView() {
  const view = win.document.createElement('hui-view-container');
  const nativeView = win.document.createElement('hui-view');
  view.append(nativeView);
  win.document.body.append(view);
  return {view, nativeView, ...makeSections(nativeView)};
}
function spacingAdapter() {
  const adapter = new SectionsSpacingAdapter();
  cleanups.push(() => adapter.restore());
  return adapter;
}
function owned(fixture) { return fixture.shadow.querySelector(`#${STYLE_ID}`); }
function assertRestored(fixture) {
  assert.equal(owned(fixture), null);
  assert.equal(fixture.sections.hasAttribute(ACTIVE), false);
}
function makeHeader() {
  const root = win.document.createElement('hui-root');
  root.attachShadow({mode: 'open'}).innerHTML = '<div class="narrow"><div class="header"><slot name="toolbar"><div class="toolbar"><ha-menu-button></ha-menu-button><ha-tab-group><ha-tab-group-tab slot="nav" panel="0">Home</ha-tab-group-tab></ha-tab-group><div class="action-items"></div></div></slot></div><hui-view-container id="view"><hui-view></hui-view></hui-view-container></div>';
  root.lovelace = {editMode: false};
  win.document.body.append(root);
  const native = nativeHeader(root);
  assert.ok(native, 'fixture must match the supported native dashboard header');
  for (const element of [native.wrapper, native.header]) element.getBoundingClientRect = () => new win.DOMRect(0, 0, 390, 64);
  return {root, ...native, sectionsFixture: makeSections(native.view.querySelector('hui-view'))};
}

// These tests exercise recognition and reversible DOM ownership. Happy DOM
// does not establish rendered spacing, CSS layout, or browser visual quality.
test('supported native sections keep the original nodes and handlers with one owned style', () => {
  const fixture = makeView();
  const originalChildren = [...fixture.wrapper.childNodes];
  const card = fixture.container.querySelector('hui-card');
  let clicks = 0;
  card.addEventListener('click', () => clicks++);
  const adapter = spacingAdapter();
  adapter.update(fixture.view);
  const style = owned(fixture);
  assert.ok(style);
  assert.equal(fixture.sections.hasAttribute(ACTIVE), true);
  adapter.update(fixture.view);
  adapter.update(fixture.view);
  assert.equal(owned(fixture), style);
  assert.equal(fixture.shadow.querySelectorAll(`#${STYLE_ID}`).length, 1);
  assert.deepEqual([...fixture.wrapper.childNodes], originalChildren);
  assert.equal(fixture.container.querySelector('hui-card'), card);
  card.click();
  assert.equal(clicks, 1);
  adapter.restore();
  assertRestored(fixture);
  assert.deepEqual([...fixture.wrapper.childNodes], originalChildren);
  card.click();
  assert.equal(clicks, 2);
});

test('unsupported native shadow structures are left untouched', () => {
  const mutations = [
    f => f.header.remove(),
    f => f.container.remove(),
    f => f.header.replaceWith(win.document.createElement('custom-view-header')),
    f => f.header.after(win.document.createElement('div')),
    f => f.wrapper.prepend(f.container),
    f => { const outer = win.document.createElement('div'); f.shadow.append(outer); outer.append(f.wrapper); },
    f => f.wrapper.classList.remove('wrapper'),
  ];
  for (const change of mutations) {
    const fixture = makeView();
    change(fixture);
    const before = fixture.shadow.innerHTML;
    spacingAdapter().update(fixture.view);
    assertRestored(fixture);
    assert.equal(fixture.shadow.innerHTML, before);
  }
});

test('custom card shadows and sections outside the direct native view chain are ignored', () => {
  const fixture = makeView();
  fixture.sections.remove();
  const direct = makeSections(fixture.view);
  const intermediary = win.document.createElement('custom-layout');
  fixture.nativeView.append(intermediary);
  const nested = makeSections(intermediary);
  const custom = win.document.createElement('custom-card');
  fixture.view.append(custom);
  const shadow = custom.attachShadow({mode: 'open'});
  const customView = win.document.createElement('hui-view');
  shadow.append(customView);
  const customShadow = makeSections(customView);
  spacingAdapter().update(fixture.view);
  for (const unsupported of [direct, nested, customShadow]) assertRestored(unsupported);
});

test('late native shadow creation is handled on the next update', () => {
  const fixture = makeView();
  fixture.sections.remove();
  const sections = win.document.createElement('hui-sections-view');
  fixture.nativeView.append(sections);
  const adapter = spacingAdapter();
  adapter.update(fixture.view);
  assert.equal(sections.hasAttribute(ACTIVE), false);
  const shadow = sections.attachShadow({mode: 'open'});
  shadow.innerHTML = '<div class="wrapper"><hui-view-header></hui-view-header><div class="container"></div></div>';
  adapter.update(fixture.view);
  assert.ok(shadow.querySelector(`#${STYLE_ID}`));
  assert.equal(sections.hasAttribute(ACTIVE), true);
});

test('detached and replaced native sections are cleaned up before replacements are styled', () => {
  const fixture = makeView();
  const adapter = spacingAdapter();
  adapter.update(fixture.view);
  fixture.sections.remove();
  adapter.update(fixture.view);
  assertRestored(fixture);
  const replacement = makeSections(fixture.nativeView);
  adapter.update(fixture.view);
  assert.ok(owned(replacement));
  assert.equal(replacement.sections.hasAttribute(ACTIVE), true);
  const nextView = makeView();
  adapter.update(nextView.view);
  assertRestored(replacement);
  assert.ok(owned(nextView));
  nextView.view.remove();
  adapter.update(nextView.view);
  assertRestored(nextView);
});

test('a previously supported structure restores when Home Assistant replaces its layout', () => {
  const fixture = makeView();
  const adapter = spacingAdapter();
  adapter.update(fixture.view);
  fixture.header.after(win.document.createElement('custom-layout'));
  adapter.update(fixture.view);
  assertRestored(fixture);
  assert.equal(fixture.header.parentElement, fixture.wrapper);
  assert.equal(fixture.container.parentElement, fixture.wrapper);
});

test('restore removes only owned style and marker and leaves unrelated presentation untouched', () => {
  const fixture = makeView();
  const externalStyle = win.document.createElement('style');
  externalStyle.id = 'another-integration-style';
  externalStyle.textContent = '.container { color: purple; }';
  fixture.shadow.append(externalStyle);
  fixture.sections.setAttribute('data-other-integration', 'keep');
  fixture.sections.setAttribute('aria-label', 'Home');
  fixture.sections.className = 'external-class';
  fixture.sections.style.setProperty('--external-color', 'purple');
  const original = fixture.shadow.innerHTML;
  const adapter = spacingAdapter();
  adapter.update(fixture.view);
  const laterStyle = win.document.createElement('style');
  laterStyle.textContent = '.wrapper { background: blue; }';
  fixture.shadow.append(laterStyle);
  adapter.restore();
  adapter.restore();
  assertRestored(fixture);
  assert.equal(externalStyle.parentNode, fixture.shadow);
  assert.equal(laterStyle.parentNode, fixture.shadow);
  laterStyle.remove();
  assert.equal(fixture.shadow.innerHTML, original);
  assert.equal(fixture.sections.getAttribute('data-other-integration'), 'keep');
  assert.equal(fixture.sections.getAttribute('aria-label'), 'Home');
  assert.equal(fixture.sections.className, 'external-class');
  assert.equal(fixture.sections.style.getPropertyValue('--external-color'), 'purple');
});

test('HeaderAdapter restores both navigation and sections styling on disable, native edit mode and destroy', () => {
  for (const reason of ['disable', 'wrapper edit mode', 'lovelace edit mode', 'destroy']) {
    const fixture = makeHeader();
    const adapter = new HeaderAdapter(fixture.root, () => {});
    cleanups.push(() => adapter.destroy());
    adapter.update(enabled, viewport);
    assert.ok(fixture.root.shadowRoot.querySelector('#liquid-glass-navigation-style'), reason);
    assert.ok(owned(fixture.sectionsFixture), reason);
    if (reason === 'destroy') adapter.destroy();
    else {
      if (reason === 'wrapper edit mode') fixture.wrapper.classList.add('edit-mode');
      if (reason === 'lovelace edit mode') fixture.root.lovelace.editMode = true;
      adapter.update(reason === 'disable' ? DISABLED : enabled, viewport);
    }
    assert.equal(fixture.root.shadowRoot.querySelector('#liquid-glass-navigation-style'), null, reason);
    assert.equal(fixture.root.hasAttribute('data-liquid-glass-navigation'), false, reason);
    assertRestored(fixture.sectionsFixture);
  }
});

test('the spacing selector targets only hidden headers without explicit margins or sidebar tabs', () => {
  const fixture = makeView();
  spacingAdapter().update(fixture.view);
  const sheet = new win.CSSStyleSheet();
  sheet.replaceSync(owned(fixture).textContent);
  const rules = [...sheet.cssRules].filter(rule => rule.selectorText);
  assert.equal(rules.length, 1);
  const hostBoundary = ':host([data-liquid-glass-sections]) > ';
  assert.ok(rules[0].selectorText.startsWith(hostBoundary));
  const selector = rules[0].selectorText.slice(hostBoundary.length);
  // Match the actual selector within the known host. This verifies selector
  // eligibility only, not whether a browser paints the resulting padding.
  assert.equal(fixture.container.matches(selector), false, 'a visible native header keeps its original spacing');
  fixture.header.hidden = true;
  assert.equal(fixture.container.matches(selector), true);
  for (const className of ['top-margin', 'has-sidebar-tabs']) {
    fixture.wrapper.classList.add(className);
    assert.equal(fixture.container.matches(selector), false, className);
    fixture.wrapper.classList.remove(className);
  }
  fixture.header.after(win.document.createElement('div'));
  assert.equal(fixture.container.matches(selector), false, 'the header and container must remain adjacent');
});
