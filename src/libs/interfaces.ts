export interface AccessorStaticInterface {
  [key: string]: {
    get: Function;
    set: Function;
  }
};

export interface ArrayOfHooksInterface {
  created: HookInterface[];
  attached: HookInterface[];
  detached: HookInterface[];
}

export interface AttributeChangedCallbackInterface {
  (newValue: any, oldValue: any): void;
};

export interface AttributeDefinitionInterface {
  type?: any;
  default?: any;
  required?: boolean;
  callback?: AttributeChangedCallbackInterface;
}

export interface AttributesDefinitionInterface {
  [key: string]: AttributeDefinitionInterface;
}

export type ComponentConstructorInterface = new (element: HTMLElement) => ComponentInterface;

export interface ComponentInterface {
  element: HTMLElement;
  created():void;
  attached():void;
  detached():void;

  attributesCallback(key: string, value: any, oldValue: any):void;
}

export interface ComponentStaticInterface extends HasAttributesDefinitionInterface, HasInitialStateInterface {
  name: String;

  hooks: ArrayOfHooksInterface;
  methods: Map<string, Function>;
  accessors: AccessorStaticInterface;
};

export interface HasAttributesDefinitionInterface {
  attributes?: AttributesDefinitionInterface | undefined;
}

export interface HasHooksInterface {
  created?: HookInterface;
  attached?: HookInterface;
  detached?: HookInterface;
}

export interface HasInitialStateInterface {
  initialState?: object | undefined;
}

export interface HasMixinsInterface {
  use?: MixinStaticInterface[] | undefined;
}

export interface HookInterface {
  (): void;
};

export interface MixinStaticInterface extends HasAttributesDefinitionInterface, HasMixinsInterface, HasInitialStateInterface, HasHooksInterface {
  name: String;
};

export interface LocationResourceInterface {
  lat?: HookInterface;
  lng?: HookInterface;
}