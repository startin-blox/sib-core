import { HasAttributesDefinitionInterface } from './HasAttributesDefinitionInterface.js';
import { HasInitialStateInterface } from './HasInitialStateInterface.js';
import { ArrayOfHooksInterface } from './ArrayOfHooksInterface.js';
import { AccessorStaticInterface } from './AccessorStaticInterface.js';

export interface ComponentStaticInterface extends HasAttributesDefinitionInterface, HasInitialStateInterface {
  name: String;

  hooks: ArrayOfHooksInterface;
  methods: Map<string, Function>;
  accessors: AccessorStaticInterface;
};
