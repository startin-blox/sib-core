import { HookInterface } from './HookInterface.js';

export interface ArrayOfHooksInterface {
  created: HookInterface[];
  attached: HookInterface[];
  detached: HookInterface[];
}
