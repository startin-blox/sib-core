import { HasAttributesDefinitionInterface } from './HasAttributesDefinitionInterface.js';
import { HasInitialStateInterface } from './HasInitialStateInterface.js';
import { ArrayOfHooksInterface } from './ArrayOfHooksInterface.js';

export interface ComponentStaticInterface extends HasAttributesDefinitionInterface, HasInitialStateInterface {
  name: String;

  hooks: ArrayOfHooksInterface;
  methods: Map<string, Function>;
};
