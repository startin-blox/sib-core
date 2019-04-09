import { HookInterface } from './HookInterface';

export interface ArrayOfHooksInterface {
  created: HookInterface[];
  attached: HookInterface[];
  detached: HookInterface[];
}
