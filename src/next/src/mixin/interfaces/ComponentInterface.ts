export interface ComponentInterface {
    element: HTMLElement;
    created():void;
    attached():void;
    detached():void;
}