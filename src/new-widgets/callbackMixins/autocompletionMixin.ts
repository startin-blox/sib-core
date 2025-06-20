import SlimSelect from 'slim-select';
import type { PostProcessorRegistry } from '../../libs/PostProcessorRegistry.ts';
import {
  asyncQuerySelector,
  fuzzyCompare,
  importInlineCSS,
} from '../../libs/helpers.ts';
import { TranslationMixin } from '../../mixins/translationMixin.ts';

const AutocompletionMixin = {
  name: 'autocompletion-mixin',
  use: [TranslationMixin],
  attributes: {
    searchText: {
      type: String,
      default: null,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'searchText');
      },
    },
    searchPlaceholder: {
      type: String,
      default: null,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'searchPlaceholder');
      },
    },
  },
  initialState: {
    slimSelect: null,
  },
  created() {
    importInlineCSS(
      'slimselect-base',
      () => import('slim-select/styles?inline'),
    );

    this.slimSelect = null;
    this.addToAttributes(true, 'autocomplete');
    this.listCallbacks.attach(
      this.addCallback.bind(this),
      'AutocompletionMixin:addCallback',
    );
  },
  detached() {
    this.slimSelect?.destroy();
    this.slimSelect = null;
  },
  addCallback(value: string, listCallbacks: PostProcessorRegistry) {
    asyncQuerySelector('select:has(option)', this.element).then(select => {
      this.initSlimSelect(select);
    });
    const nextProcessor = listCallbacks.shift();
    if (nextProcessor) nextProcessor(value, listCallbacks);
  },
  async initSlimSelect(select: Element) {
    this.slimSelect?.destroy();
    const slimSelect = new SlimSelect({
      select,
      settings: {
        contentPosition: 'fixed',
        placeholderText:
          this.placeholder || this.t('autocompletion.placeholder'),
        searchText: this.searchText || this.t('autocompletion.searchText'),
        searchPlaceholder:
          this.searchPlaceholder || this.t('autocompletion.searchPlaceholder'),
        contentLocation: this.element,
      },
      events: {
        afterChange: () => {
          this.element.dispatchEvent(new Event('input', { bubbles: true }));
        },
        searchFilter: (option, filterValue) =>
          fuzzyCompare(option.text, filterValue),
      },
    });
    this.slimSelect = slimSelect;
    this.element.addEventListener('input', (e: Event) => {
      if (e.target !== this.element) {
        // avoid update search result when search in slimSelect suggestions
        e.stopPropagation();
      }
    });
  },
};

export { AutocompletionMixin };
