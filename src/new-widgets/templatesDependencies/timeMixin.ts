const TimeMixin = {
  name: 'time-mixin',
  attributes : {
    step : {
      type: Number,
      callback: function (newValue: number) {
        this.addToAttributes(newValue, 'step');
      }
    },
  },
}

export {
  TimeMixin
}