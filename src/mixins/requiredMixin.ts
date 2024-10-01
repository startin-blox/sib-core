import { PostProcessorRegistry } from "../libs/PostProcessorRegistry";

const RequiredMixin = {
  name: 'required-mixin',
  use: [],
  attached(): void {
    this.listPostProcessors.attach(this.requiredResources.bind(this), 'RequiredMixin:requiredResources');
  },
  async requiredResources(resources: object[], listPostProcessors: PostProcessorRegistry, div: HTMLElement, context: string): Promise<void> {
    const displays: any[] = [];
    const requiredFields = Array.from((this.element as Element).attributes).filter(attr => attr.name.startsWith('required-'))
      .map(attr => {
        return (attr.value !== '' ? attr.value : attr['name'].replace('required-', ''));
    });

    if (requiredFields.length) {
      for (let resource of resources) {
        let hasProps = true;
        for(let field of requiredFields) {
          // Retrieve resource from store
          let res = await resource[field];
          if (!res || res == null) {
            hasProps = false;
            continue;
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
