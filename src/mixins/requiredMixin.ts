import { store } from '../libs/store/store';

const RequiredMixin = {
  name: 'required-mixin',
  use: [],
  attached(): void {
    this.listPostProcessors.push(this.requiredResources.bind(this));
  },
  async requiredResources(resources: object[], listPostProcessors: Function[], div: HTMLElement, context: string): Promise<void> {
    const displays: any[] = [];
    const requiredFields = Array.from((this.element as Element).attributes).filter(attr => attr.name.startsWith('required-'))
      .map(attr => {
        return (attr.value !== '' ? attr.value : attr['name'].replace('auto-range-', ''));
    });

    if (requiredFields.length) {
      for (let resource of resources) {
        let hasProps = true;
        for(let field of requiredFields) {
          // Retrieve resource from store
          let res = store.get(resource['@id']);
          if (!res && !resource[field] && !await resource[field]) {
            //TODO: refactor to better handle this edge case where res is either the direct resource or a proxy
            res = await store.getData(resource['@id'], this.context);
            if (!res || res[field] == null || res[field] == "") {
              hasProps = false;
              continue
            }
          } else if (res) {
            if (await res[field] == null || await res[field] == "") {
              hasProps = false;
              continue
            }
          }
        }
        if (hasProps) displays.push(resource);
      }
    }
    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor) await nextProcessor(requiredFields.length ? displays : resources, listPostProcessors, div, context);
  }
}

export {
  RequiredMixin
}
