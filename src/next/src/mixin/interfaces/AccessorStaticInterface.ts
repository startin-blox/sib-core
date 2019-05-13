export interface AccessorStaticInterface {
  [key: string]: {
    get: Function;
    set: Function;
  }
};
