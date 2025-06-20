import type { PostProcessorRegistry } from '../libs/PostProcessorRegistry.ts';

const RequiredMixin = {
  name: 'required-mixin',
  use: [],
  attached(): void {
    this.listPostProcessors.attach(
      this.requiredResources.bind(this),
      'RequiredMixin:requiredResources',
    );
  },
  async requiredResources(
    resources: object[],
    listPostProcessors: PostProcessorRegistry,
    div: HTMLElement,
    context: string,
  ): Promise<void> {
    const displays: any[] = [];
    const requiredFields = Array.from((this.element as Element).attributes)
      .filter(attr => attr.name.startsWith('required-'))
      .map(attr => {
        return attr.value !== ''
          ? attr.value
          : attr.name.replace('required-', '');
      });

    if (requiredFields.length > 0) {
      for (const resource of resources) {
        let hasProps = true;
        for (const field of requiredFields) {
          // Retrieve resource from store
          const res = await resource[field];
          if (
            !res ||
            (typeof res === 'object' && '@value' in res && !res['@value'])
          ) {
            hasProps = false;
            break;
          }
        }
        if (hasProps) displays.push(resource);
      }
    }
    const nextProcessor = listPostProcessors.shift();
    if (nextProcessor)
      await nextProcessor(
        requiredFields.length > 0 ? displays : resources,
        listPostProcessors,
        div,
        context,
      );
  },
};

export { RequiredMixin };
