import { HasAttributesDefinitionInterface } from './HasAttributesDefinitionInterface';
import { HasMixinsInterface } from './HasMixinsInterface.js';
import { HasInitialStateInterface } from './HasInitialStateInterface.js';
import { HasHooksInterface } from './HasHooksInterface.js';

export interface MixinStaticInterface extends HasAttributesDefinitionInterface, HasMixinsInterface, HasInitialStateInterface, HasHooksInterface {
  name: String;
};
