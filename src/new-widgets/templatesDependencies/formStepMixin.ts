const FormStepMixin = {
  name: 'form-time-mixin',
  attributes: {
    step: {
      type: Number,
      callback: function (newValue: number) {
        this.addToAttributes(newValue, 'step');
      },
    },
  },
};

export { FormStepMixin };
