import { fuzzyCompare, importInlineCSS } from '../../libs/helpers';
import SlimSelect from 'slim-select';
import { TranslationMixin } from '../../mixins/translationMixin';

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
    importInlineCSS('slimselect', () => import('./slimselect.css?inline'))

    this.slimSelect = null;
    this.addToAttributes(true, 'autocomplete');
    this.listCallbacks.push(this.addCallback.bind(this));
  },
  detached() {
    if (this.slimSelect) this.slimSelect.destroy();
    if (this.mutationObserver) this.mutationObserver.disconnect();
  },
  addCallback(value: string, listCallbacks: Function[]) {
    if (this.slimSelect) return;
    let select = this.element.querySelector('select');
    if (select) {
      this.initSlimSelect(select);
    } else {
      // if no select available, wait for one and init slimSelect
      new MutationObserver((_m, observer) => {
        const select = this.element.querySelector('select');
        if (select) {
          this.initSlimSelect(select);
          observer.disconnect(); // then disconnect mutationObserver
        }
      }).observe(this.element, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
    const nextProcessor = listCallbacks.shift();
    if (nextProcessor) nextProcessor(value, listCallbacks);
  },
  initSlimSelect(select: Element) {
    const slimSelect = new SlimSelect({ select });
    this.slimSelect = slimSelect;
    select.addEventListener('change', () => {
      this.slimSelect.render();
      this.element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    this.element.addEventListener('input', (e:Event) => {
      if(e.target !== this.element) {
        // avoid update search result when search in slimSelect suggestions
        e.stopPropagation();
      }
    });

    // when data changes, re-build slimSelect
    if (this.mutationObserver) this.mutationObserver.disconnect();
    this.mutationObserver = new MutationObserver(() => {
      this.slimSelect.destroy();
      this.slimSelect = new SlimSelect({
        select,
        placeholder: this.placeholder || this.t("autocompletion.placeholder"),
        searchText: this.searchText || this.t("autocompletion.searchText"),
        searchPlaceholder: this.searchPlaceholder || this.t("autocompletion.searchPlaceholder"),
        searchFilter: (option, filterValue) => fuzzyCompare(option.text, filterValue),
      });
    }).observe(select, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  },
};

export { AutocompletionMixin };
