import { Sib } from './Sib.js';
import { base_context, store } from './store.js';

const StoreMixin = {
  name: 'store-mixin',
  use: [],
  attributes: {
    dataSrc: {
      type: String,
      default: '',
      callback: function (value) {
        this.empty();

        // brings a loader out if the attribute is set
        this.toggleLoaderHidden(false);

        if (!value) return;

        // gets the data through the store
        store.get(value, this.getContext()).then(async resource => {
          this.empty();
          this.resource = resource;
          this.populate();
          this.toggleLoaderHidden(true);
        });
      },
    },
    idSuffix: {
      type: String,
      default: ''
    },
    extraContext: {
      type: String,
      default: ''
    },
    next: {
      type: String,
      default: ''
    },
    loaderId: {
      type: String,
      default: ''
    },
  },
  initialState: {
    resource: {},
  },
  getContext() {
    return { ...base_context };
  },
  isContainer() {
    return '@type' in this.resource && this.resource['@type'] === 'ldp:Container';
  },
  getResources() {
    if (!this.isContainer() || !this.resource['ldp:contains']) return [];
    if (Array.isArray(this.resource['ldp:contains']))
      return this.resource['ldp:contains'];
    return [this.resource['ldp:contains']];
  },
  toggleLoaderHidden(toggle) {
    console.log('hide loader: ' + toggle);
  },
};


const ListMixin = {
  name: 'list-mixin',
  use: [],
  appendSingleElt() {
    this.appendChildElt(this.resource);
  },
  populate() {
    if (!this.isContainer()) {
      this.appendSingleElt();
      return;
    }

    for (let resource of this.getResources()) {
      //for federations, fetch every sib:source we find
      if (resource['@type'] !== 'sib:source') {
        this.appendChildElt(resource);
        continue;
      }
      store.get(resource.container, this.context).then(container => {
        for (let resource of container['ldp:contains']) {
          this.appendChildElt(resource);
        }
      });
    }
  }
}


const WidgetMixin = {
  name: 'widget-mixin',
  use: [],
  attributes: {
    dataFields: {
      type: String,
      default: 'test-field',
      callback: function () {
        console.log(this.element); // undefined
        console.log(this.dataFields); // ERROR: Cannot read property 'hasAttribute' of undefined
      }
    }
  },
  created() {
    console.log(this.element); // OK
    console.log(this.dataFields); // OK
  },
  getDiv() {
    console.log(this.element); // undefined
    console.log(this.dataFields); // ERROR: Cannot read property 'hasAttribute' of undefined
    if (this._div) return this._div;
    this._div = document.createElement('div');
    this.element.appendChild(this._div);
    return this._div;
  },
  empty() {
    //TODO: implement this
  }
}

const SibDisplay = {
  name: 'sib-display',
  use: [WidgetMixin, ListMixin, StoreMixin],

  appendChildElt() {
    const child = document.createElement('div');
    this.getDiv().appendChild(child);
  }
};

Sib.register(SibDisplay);
document.createElement('sib-display');