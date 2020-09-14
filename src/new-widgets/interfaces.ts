import type { MixinStaticInterface } from '../libs/interfaces.js';

export interface Template {
  template: Function
  dependencies: MixinStaticInterface[]
}

export interface WidgetMixinsInterface {
  templateMixin: Template
  mixins: MixinStaticInterface[]
}