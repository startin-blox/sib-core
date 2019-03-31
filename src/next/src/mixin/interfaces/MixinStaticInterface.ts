import { AttributesDefinitionInterface } from './AttributesDefinitionInterface';
import { HookInterface } from './HookInterface';

export interface MixinStaticInterface {
  name: String;
  use: MixinStaticInterface[] | undefined;
  attributes: AttributesDefinitionInterface[] | undefined;
  initialState: Object | undefined;
  created: HookInterface | undefined;
  attached: HookInterface | undefined;
  detached: HookInterface | undefined;
};
