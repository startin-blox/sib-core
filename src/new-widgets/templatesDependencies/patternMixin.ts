const PatternMixin = {
  name: 'pattern-mixin',
  attributes : {
    pattern : {
      type: String,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'pattern')
      }
    },
    title : {
      type: String,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'title');
      }
    },
  },
  getValueFromElement(element: any) {
    return element.value ? String(element.value) : '';
  }
}

export {
  PatternMixin
}