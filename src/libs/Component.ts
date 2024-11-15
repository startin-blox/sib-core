import { Profiler } from '../logger';
import type { ComponentInterface } from './interfaces.js';

export abstract class Component implements ComponentInterface {
  public element: HTMLElement;
  public profiler: Profiler;

  constructor(element: HTMLElement) {
    this.element = element;
    this.profiler = new Profiler();
  }

  created() {}
  attached() {}
  detached() {}

  attributesCallback(_key: string, _value: any, _oldValue: any): void {}
}
