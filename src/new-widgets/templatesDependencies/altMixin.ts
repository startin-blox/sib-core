const AltMixin = {
  name: 'alt-mixin',
  attributes : {
    alt : {
      type: String,
      callback: function (newValue: string) {
        this.addToAttributes(newValue, 'alt')
      }
    },
  },
}

export {
  AltMixin
}