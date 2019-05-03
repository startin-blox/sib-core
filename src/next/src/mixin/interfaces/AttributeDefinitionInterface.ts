import { AttributeChangedCallbackInterface } from './AttributeChangedCallbackInterface.js';

export interface AttributeDefinitionInterface {
  type?: any;
  default?: any;
  required?: boolean;
  callback?: AttributeChangedCallbackInterface;
}
