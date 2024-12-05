const PatternMixin = {
  name: 'pattern-mixin',
  attributes: {
    pattern: {
      type: String,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'pattern');
      },
    },
    title: {
      type: String,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'title');
      },
    },
  },
};

export { PatternMixin };
