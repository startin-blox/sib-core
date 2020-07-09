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
  isContainer: Function
  properties: string[]
}