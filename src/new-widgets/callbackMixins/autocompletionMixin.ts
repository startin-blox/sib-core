import { importCSS } from '../../libs/helpers.js';
import SlimSelect from 'slim-select';

const AutocompletionMixin = {
  name: 'autocompletion-mixin',
  initialState: {
    slimSelect: null,
  },
  created() {
    importCSS('../../web_modules/slim-select/dist/slimselect.css');
    this.slimSelect = null;
    this.listCallbacks.push(this.addCallback.bind(this));
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
    this.slimSelect = new SlimSelect({ select });
    select.addEventListener('change', () => this.slimSelect.render());

    // when data changes, re-build slimSelect
    new MutationObserver(() => {
      this.slimSelect.destroy();
      this.slimSelect = new SlimSelect({ select });
    }).observe(select, {
      childList: true,
      characterData: true,
      subtree: true,
    });

  }
}

export {
  AutocompletionMixin
}