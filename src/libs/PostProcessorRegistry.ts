export type PostProcessor = {
  name: string;
  fn: Function;
};

export class PostProcessorRegistry {
  private currentPostProcessors: PostProcessor[];

  constructor(currentPostProcessors: PostProcessor[] = []) {
    this.currentPostProcessors = [...currentPostProcessors];
  }

  public attach(callback: Function, callbackName: string): void {
    this.currentPostProcessors.push({ name: callbackName, fn: callback });
  }

  public getPostProcessors(): PostProcessor[] {
    return this.currentPostProcessors;
  }

  public printCurrentCallbacks(): void {
    if (this.currentPostProcessors.length === 0) {
    } else {
      for (const _postProcessor of this.currentPostProcessors) {
      }
    }
  }

  public getFormattedCallbacks(): string {
    if (this.currentPostProcessors.length === 0) {
      return 'No post-processors registered.';
    }
    let formattedText = 'Registered post-processors:\n';
    for (const postProcessor of this.currentPostProcessors) {
      formattedText += `- ${postProcessor.name}\n`;
    }
    return formattedText.trim();
  }

  static printFormattedCallbacks(
    currentPostProcessors: PostProcessor[],
  ): string {
    if (currentPostProcessors.length === 0) {
      return 'No post-processors registered.';
    }
    let formattedText = 'Registered post-processors:\n';
    for (const postProcessor of currentPostProcessors) {
      formattedText += `- ${postProcessor.name}\n`;
    }
    return formattedText.trim();
  }

  public whichCallbackExecutedNext(): string {
    if (this.currentPostProcessors.length === 0) {
      return 'No post-processors registered.';
    }
    return `Next post-processor to be executed is: ${this.currentPostProcessors[0].name}`;
  }

  public deepCopy(): PostProcessorRegistry {
    const copy = new PostProcessorRegistry(this.currentPostProcessors);
    return copy;
  }

  public shift(): Function | undefined {
    const res = this.currentPostProcessors.shift();

    if (res) {
      return res.fn;
    }
    return undefined;
  }
}
