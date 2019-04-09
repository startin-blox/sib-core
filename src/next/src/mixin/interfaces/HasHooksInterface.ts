import { HookInterface } from './HookInterface';

export interface HasHooksInterface {
  created?: HookInterface;
  attached?: HookInterface;
  detached?: HookInterface;
}
