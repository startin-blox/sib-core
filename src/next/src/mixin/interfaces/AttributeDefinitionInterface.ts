import { AttributeChangedCallbackInterface } from './AttributeChangedCallbackInterface';

export interface AttributeDefinitionInterface {
  type: any;
  default: any;
  required: boolean;
  callback: AttributeChangedCallbackInterface;
}
