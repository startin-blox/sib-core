import { importCSS } from '../../libs/helpers.js';
//@ts-ignore
import SlimSelect from 'https://dev.jspm.io/slim-select@1.23';

const AutocompletionMixin = {
  name: 'autocompletion-mixin',
  initialState: {
    isRendering: false,
  },
  created() {
    this.isRendering = false;
    this.listCallbacks.push(this.addCallback.bind(this));
  },
  addCallback(value: string, listCallbacks: Function[]) {
    setTimeout(() => {
      let select = this.element.querySelector('select');
      if (select) {
        let slimSelect = new SlimSelect({ select });
        importCSS('https://dev.jspm.io/slim-select/dist/slimselect.min.css');
        select.addEventListener('change', () => slimSelect.render());

        // when data changes, re-build slimSelect
        new MutationObserver(() => {
          if (this.isRendering) return;
          this.isRendering = true;
          slimSelect.destroy();
          slimSelect = new SlimSelect({ select });
          this.isRendering = false;
        }).observe(select, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      }

      const nextProcessor = listCallbacks.shift();
      if (nextProcessor) nextProcessor(value, listCallbacks);
    })
  }
}

export {
  AutocompletionMixin
}