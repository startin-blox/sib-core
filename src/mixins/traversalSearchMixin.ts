import { parseFieldsString } from '../libs/helpers';

const TraversalSearchMixin = {
  name: 'traversal-search-mixin',
  use: [],
  initialState: {
    searchCount: null,
  },
  attributes: {
    values: {
      type: Array,
      default: []
    },
  },
  created() {
    this.searchCount = new Map();
    this.element.addEventListener('populate', () => {
    });
  },
  triggerTraversalSearch(): void {
    console.log(this.element);
    console.log("Fields", this.fields);
    // Get all values from all fields in the form
    // Add that to a values[] arrayconst fields = Object.keys(filters);
    let fields = parseFieldsString(this.fields);
    fields.forEach((field) => {
      console.log(field, this.element.querySelector('[name="'+field+'"] input').value);
      this.values[field] = [];
      let valuesArray = parseFieldsString(this.element.querySelector('[name="'+field+'"] input').value);
      valuesArray.forEach((value) => {
        this.values[field].push(value);
      });
    });
    console.log(this.values);
  },
  attached(): void {
    this.element.addEventListener(
        'formChange',
        () => this.triggerTraversalSearch()
    );
  },
}

export {
    TraversalSearchMixin
}