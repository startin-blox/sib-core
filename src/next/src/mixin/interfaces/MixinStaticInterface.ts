import { HasAttributesDefinitionInterface } from './HasAttributesDefinitionInterface';
import { HasMixinsInterface } from './HasMixinsInterface';
import { HasInitialStateInterface } from './HasInitialStateInterface';
import { HasHooksInterface } from './HasHooksInterface';

export interface MixinStaticInterface extends HasAttributesDefinitionInterface, HasMixinsInterface, HasInitialStateInterface, HasHooksInterface {
  name: String;
};
