export interface ComponentInterface {
    element: HTMLElement;
    created():void;
    attached():void;
    detached():void;

    attributesCallback(key: string, value: any, oldValue: any):void;
}
