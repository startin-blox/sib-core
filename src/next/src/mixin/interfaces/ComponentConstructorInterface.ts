import { ComponentInterface } from "./ComponentInterface";

export type ComponentConstructorInterface = new (element: HTMLElement) => ComponentInterface;