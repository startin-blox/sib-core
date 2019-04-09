import { HasAttributesDefinitionInterface } from './HasAttributesDefinitionInterface';
import { HasInitialStateInterface } from './HasInitialStateInterface';
import { ArrayOfHooksInterface } from './ArrayOfHooksInterface';

export interface ComponentStaticInterface extends HasAttributesDefinitionInterface, HasInitialStateInterface {
  name: String;

  hooks: ArrayOfHooksInterface;
  methods: Map<string, function>;
};
