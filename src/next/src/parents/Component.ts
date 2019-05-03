import { ComponentInterface } from "../mixin/interfaces/ComponentInterface.js";

export abstract class Component implements ComponentInterface {
  public element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  created() {}
  attached() {}
  detached() {}
}
