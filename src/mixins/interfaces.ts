export enum WidgetType {
  CUSTOM = "custom",
  USER = "user",
  NATIVE = "native",
}

export interface WidgetInterface {
  tagName: String
  type: WidgetType
}

export interface Resource {
  '@id': string
  clientContext: object
  isContainer: Function
  isArray: Function
  isFullResource: Function
  properties: string[],
  serverPagination: object
}