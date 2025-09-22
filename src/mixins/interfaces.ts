export enum WidgetType {
  CUSTOM = 'custom',
  USER = 'user',
  NATIVE = 'native',
}

export interface WidgetInterface {
  tagName: string;
  type: WidgetType;
}

// export interface Resource {
//   '@id': string;
//   clientContext: object;
//   serverContext: object;
//   isContainer: Function;
//   getContainerList: Function;
//   getResourceData: Function;
//   isArray: Function;
//   isFullResource: Function;
//   properties: string[];
//   serverPagination: object;
//   merge: Function;
// }
