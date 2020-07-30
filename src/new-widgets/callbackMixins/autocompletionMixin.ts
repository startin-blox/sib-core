import { importCSS } from '../../libs/helpers.js';
//@ts-ignore
import SlimSelect from 'https://dev.jspm.io/slim-select@1.23';

const AutocompletionMixin = {
  name: 'autocompletion-mixin',
  initialState: {
    slimSelect: null,
  },
  created() {
    importCSS('https://dev.jspm.io/slim-select/dist/slimselect.min.css');
    this.slimSelect = null;
    this.listCallbacks.push(this.addCallback.bind(this));
  },
  addCallback(value: string, listCallbacks: Function[]) {
    if (this.slimSelect) return;
    let select = this.element.querySelector('select');
    if (select) {
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
    const nextProcessor = listCallbacks.shift();
    if (nextProcessor) nextProcessor(value, listCallbacks);
  }
}

export {
  AutocompletionMixin
}