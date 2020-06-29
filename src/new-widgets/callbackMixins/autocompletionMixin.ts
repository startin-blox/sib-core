import { importCSS } from '../../libs/helpers.js';
//@ts-ignore
import SlimSelect from 'https://dev.jspm.io/slim-select@1.23';

const AutocompletionMixin = {
  name: 'autocompletion-mixin',
  attached() {
    this.listCallbacks.push(this.addCallback.bind(this));
  },
  addCallback(value: string, listCallbacks: Function[]) {
    // TODO : until make values appear too late
    let select = this.element.querySelector('select');
    if (select) {
      const slimSelect = new SlimSelect({ select });
      importCSS('https://dev.jspm.io/slim-select/dist/slimselect.min.css');
      select.addEventListener('change', () => slimSelect.render());
    }

    const nextProcessor = listCallbacks.shift();
    if(nextProcessor) nextProcessor(value, listCallbacks);
  }
}

export {
  AutocompletionMixin
}