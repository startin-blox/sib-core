import { HookInterface } from './HookInterface.js';

export interface HasHooksInterface {
  created?: HookInterface;
  attached?: HookInterface;
  detached?: HookInterface;
}
