import { base_context } from '../libs/store/store';

const ContextMixin = {
  name: 'store-mixin',
  use: [],
  attributes: {
    extraContext: {
      type: String,
      default: null,
    },
  },
  get context(): object {
    return { ...base_context, ...this.extra_context };
  },
  get extra_context(): object {
    const extraContextElement = this.extraContext
      ? document.getElementById(this.extraContext)
      : // take element extra context first
        document.querySelector('[data-default-context]'); // ... or look for a default extra context

    if (extraContextElement)
      return JSON.parse(extraContextElement.textContent || '{}');
    return {};
  },
};

export { ContextMixin };
