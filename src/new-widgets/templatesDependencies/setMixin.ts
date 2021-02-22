const SetMixin = {
  name: 'set-mixin',
  /**
   * For sets and group widgets, remove auto rendering
   * function to allow only manual renders
   */
  planRender() { },
}

export {
  SetMixin
}