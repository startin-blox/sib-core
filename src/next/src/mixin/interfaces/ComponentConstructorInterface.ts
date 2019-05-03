import { ComponentInterface } from "./ComponentInterface.js";

export type ComponentConstructorInterface = new (element: HTMLElement) => ComponentInterface;