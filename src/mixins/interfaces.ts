export enum WidgetType {
  CUSTOM = "custom",
  NATIVE = "native",
}

export interface WidgetInterface {
  tagName: String
  type: WidgetType
}

export interface Resource {
  '@id': string
  isContainer: Function
  properties: string[]
}