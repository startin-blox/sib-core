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
            console.log('No post-processors registered.');
        } else {
            console.log('Registered post-processors:');
            this.currentPostProcessors.forEach(proc => {
                console.log(`- ${proc.name}`);
            });
        }
    }

    public getFormattedCallbacks(): string {
        if (this.currentPostProcessors.length === 0) {
            return 'No post-processors registered.';
        } else {
            let formattedText = 'Registered post-processors:\n';
            this.currentPostProcessors.forEach(proc => {
                formattedText += `- ${proc.name}\n`;
            });
            return formattedText.trim();
        }
    }

    static printFormattedCallbacks(currentPostProcessors: PostProcessor[]): string {
        if (currentPostProcessors.length === 0) {
            return 'No post-processors registered.';
        } else {
            let formattedText = 'Registered post-processors:\n';
            currentPostProcessors.forEach(proc => {
                formattedText += `- ${proc.name}\n`;
            });
            return formattedText.trim();
        }
    }

    public whichCallbackExecutedNext(): string {
        if (this.currentPostProcessors.length === 0) {
            return 'No post-processors registered.';
        } else {
            return `Next post-processor to be executed is: ${this.currentPostProcessors[0].name}`;

        }
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