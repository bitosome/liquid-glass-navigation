import {NavigationController} from './controller.js';
import {VERSION} from './types.js';
const key = Symbol.for('liquid-glass-navigation.controller');
const registry = window as unknown as Record<symbol, {version: string; controller: NavigationController} | undefined>;
const previous = registry[key];
if (!previous || previous.version !== VERSION) {
  previous?.controller.stop();
  const controller = new NavigationController();
  registry[key] = {version: VERSION, controller};
  controller.start();
  console.info(`LIQUID GLASS NAVIGATION ${VERSION}`);
}
