import { asyncQuerySelector, fuzzyCompare, importInlineCSS } from '../../libs/helpers';
import SlimSelect from 'slim-select';
import { TranslationMixin } from '../../mixins/translationMixin';
import { PostProcessorRegistry } from '../../libs/PostProcessorRegistry';

const AutocompletionMixin = {
  name: 'autocompletion-mixin',
  use: [TranslationMixin],
  attributes: {
    searchText: {
      type: String,
      default: null,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'searchText');
      }
    },
    searchPlaceholder: {
      type: String,
      default: null,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'searchPlaceholder');
      }
    },
  },
  initialState: {
    slimSelect: null,
    mutationObserver: null
  },
  created() {
    importInlineCSS('slimselect-base', () => import('slim-select/styles?inline'));
    importInlineCSS('slimselect-local', () => import('./slimselect.css?inline'));

    this.slimSelect = null;
    this.addToAttributes(true, 'autocomplete');
    this.listCallbacks.attach(this.addCallback.bind(this), "AutocompletionMixin:addCallback");
  },
  detached() {
    if (this.slimSelect) this.slimSelect.destroy();
    if (this.mutationObserver) this.mutationObserver.disconnect();
  },
  addCallback(value: string, listCallbacks: PostProcessorRegistry) {
    if (this.slimSelect) return;
    asyncQuerySelector('select:has(option)', this.element).then(select => {
      this.initSlimSelect(select);
    })
    const nextProcessor = listCallbacks.shift();
    if (nextProcessor) nextProcessor(value, listCallbacks);
  },
  async initSlimSelect(select: Element) {
    const slimSelect = new SlimSelect({
      select,
      settings: {
        placeholderText: this.placeholder || this.t("autocompletion.placeholder"),
        searchText: this.searchText || this.t("autocompletion.searchText"),
        searchPlaceholder: this.searchPlaceholder || this.t("autocompletion.searchPlaceholder"),
      },
      events: {
        searchFilter: (option, filterValue) => fuzzyCompare(option.text, filterValue),
      },
    });
    this.slimSelect = slimSelect;
    this.element.addEventListener('input', (e:Event) => {
      if(e.target !== this.element) {
        // avoid update search result when search in slimSelect suggestions
        e.stopPropagation();
      }
    });
  },
};

export { AutocompletionMixin };
