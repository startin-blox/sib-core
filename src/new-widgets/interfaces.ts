import type { MixinStaticInterface } from '../libs/interfaces.ts';

export interface Template {
  template: Function;
  dependencies: MixinStaticInterface[];
}

export interface WidgetMixinsInterface {
  templateMixin: Template;
  mixins: MixinStaticInterface[];
}
