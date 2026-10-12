export const VERSION = '0.1.0';
export const MOBILE_MAX_WIDTH = 767;
export interface NavigationConfig {
  enabled: boolean;
  scope: 'mobile' | 'all';
  reduce_transparency: boolean;
  version: string;
}
export const DISABLED: NavigationConfig = {enabled: false, scope: 'mobile', reduce_transparency: false, version: VERSION};
export function parseConfig(value: unknown): NavigationConfig {
  if (!value || typeof value !== 'object') return {...DISABLED};
  const v = value as Record<string, unknown>;
  if (typeof v.enabled !== 'boolean' || !['mobile', 'all'].includes(String(v.scope)) || typeof v.reduce_transparency !== 'boolean' || typeof v.version !== 'string') return {...DISABLED};
  return {enabled: v.enabled, scope: v.scope as NavigationConfig['scope'], reduce_transparency: v.reduce_transparency, version: v.version};
}
export type Unsubscribe = () => void | Promise<void>;
export interface HassConnection {
  subscribeMessage<T>(callback: (event: T) => void, message: {type: string}, options?: {resubscribe: boolean}): Promise<Unsubscribe>;
  addEventListener?(type: string, callback: () => void): void;
  removeEventListener?(type: string, callback: () => void): void;
}
export interface HassHost extends HTMLElement {
  hass?: {connection?: HassConnection; themes?: {darkMode?: boolean}};
  lovelace?: {editMode?: boolean};
  updateComplete?: Promise<unknown>;
}
