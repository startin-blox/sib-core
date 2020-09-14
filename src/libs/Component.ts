import type { ComponentInterface } from "./interfaces.js";

export abstract class Component implements ComponentInterface {
  public element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  created() {}
  attached() {}
  detached() {}

  attributesCallback(_key: string, _value: any, _oldValue: any):void {}
}
