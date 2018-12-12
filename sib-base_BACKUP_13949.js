const base_context = {
  '@vocab': 'http://happy-dev.fr/owl/#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  ldp: 'http://www.w3.org/ns/ldp#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  name: 'rdfs:label',
};
const store = new window.MyStore({
  context: base_context,
  defaultSerializer: 'application/ld+json',
});

function uniqID() {
  return '_' + (Math.random() * Math.pow(36, 20)).toString(36).slice(0, 10);
}

function stringToDom(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

function evalTemplateString(str, variables = {}) {
  const keys = Object.keys(variables);
  const values = keys.map(key => variables[key]);
  try {
    const func = Function.call(null, ...keys, 'return `' + str + '`');
    return func(...values);
  } catch (e) {
    console.warn(e);
  }
  return '';
}

class SIBBase extends HTMLElement {
  static get observedAttributes() {
    return ['data-src'];
  }

  get extra_context() {
    return {};
  }

  get context() {
<<<<<<< HEAD
    return { ...base_context,
      ...this.extra_context
    };
=======
    return {...base_context, ...this.extra_context};
>>>>>>> e38ebf298b1e1e8f6961feb1163338fd61259312
  }

  setLoaderDisplay(display) {
    if (this.hasAttribute('loader-id'))
      document.getElementById(
        this.getAttribute('loader-id'),
      ).style.display = display;
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (attribute == 'data-src') {
      this.empty();

      // brings a loader out if the attribute is set
      this.setLoaderDisplay('block');

      // gets the data through the store
      if (newValue)
        store.get(newValue + this.idSuffix, this.context).then(resource => {
          this.empty();
          this.resource = resource;
          this.populate();
          this.setLoaderDisplay('none');
        });
    }
  }

  populate() {
    //this method should be implemented by descending components to insert content
    throw 'Not Implemented';
  }

  empty() {
    //this method should be implemented by descending components to remove all content
    throw 'Not Implemented';
  }

  connectedCallback() {
    if (this.resource) this.populate();
  }

  get isContainer() {
    return 'ldp:contains' in this.resource;
  }

  get next() {
    return this.getAttribute('next');
  }

  get idSuffix() {
    // attribute added to the id given as data-src
    if (this.hasAttribute('id-suffix'))
      return this.getAttribute('id-suffix') + '/';
    else return '';
  }

  get resources() {
    if (!this.isContainer) return [];
    if (Array.isArray(this.resource['ldp:contains']))
      return this.resource['ldp:contains'];
    return [this.resource['ldp:contains']];
  }
}

const SIBWidgetMixin = superclass =>
  class extends superclass {
    get div() {
      if (this._div) return this._div;
      this._div = document.createElement('div');
      this.appendChild(this._div);
      return this._div;
    }

    getSet(field) {
      console.log(field);
      return this.parseFieldsString(this.getAttribute('set-' + field));
    }

    parseFieldsString(fields) {
      //console.log('parseFieldsString',fields);
      return fields.split(',').map(s => s.trim().split(/\./));
    }

    get fields() {
      if (this.dataset.fields)
        return this.parseFieldsString(this.dataset.fields);

      const resource =
        this.isContainer && this.resources ? this.resources[0] : this.resource;
      return Object.keys(resource)
        .filter(prop => !prop.startsWith('@'))
        .map(a => [a]);
    }

    isSet(field) {
      return this.hasAttribute('set-' + field);
    }

    async fetchValue(resource, field) {
      if (Object.keys(resource).length <= 1) {
        resource = await store.get(resource);
      }
      return resource[field];
    }

    async getValue(field) {
      if (this.hasAttribute('value-' + field))
        return this.getAttribute('value-' + field);

      let resource = this.resource;
      for (let name of field) {
        resource = await this.fetchValue(resource, name);
        if (resource == null) return;
      }
      return resource;
    }

    empty() {
      while (this.div.firstChild) this.div.removeChild(this.div.firstChild);
    }

    getWidget(field) {
      return (
        this.getAttribute('widget-' + field.join('.')) || this.defaultWidget
      );
    }

    async widgetAttributes(field) {
      return {
        value: await this.getValue(field),
        name: field,
      };
    }

    async appendWidget(field, parent) {
      try {
        if (!parent) parent = this.div;

        const template = await this.getTemplate2(field);
        if (template) {
          parent.appendChild(template);
          return;
        }
        if (this.isSet(field)) {
          const div = document.createElement('div');
          div.setAttribute('name', field);
          parent.appendChild(div);
          for (let item of this.getSet(field))
            await this.appendWidget(item, div);
          return;
        }
        let widget;
        let attributes;

        widget = document.createElement(this.getWidget(field));
        attributes = await this.widgetAttributes(field);
        for (let name of Object.keys(attributes))
          widget[name] = attributes[name];
        parent.appendChild(widget);
      } catch (e) {
        console.error('appendWidget', field, e);
      }
    }

    async getTemplate2(field) {
      const id = this.getAttribute(`template-${field}`);
      const template = document.getElementById(id);
      if (!(template instanceof HTMLTemplateElement)) return;
      const name = field;
      const value = await this.getValue(field);
      const html = evalTemplateString(
<<<<<<< HEAD
        template.innerHTML.trim(), {
          name,
          value
        }
=======
        template.innerHTML.trim(),
        {name, value}
>>>>>>> e38ebf298b1e1e8f6961feb1163338fd61259312
      );
      return stringToDom(html);
    }
  };

const SIBListMixin = superclass =>
  class extends superclass {
    constructor() {
      super();
      this._filters = {};
      this._filtersAdded = false;
    }

    get filters() {
      return this._filters;
    }

    set filters(filters) {
      this._filters = filters;
      if (this.resource) {
        this.empty();
        this.populate();
      }
    }

    matchValue(propertyValue, filterValue) {
      console.log('matchValue', propertyValue, filterValue);
      if (filterValue === '') return true;
      if (propertyValue == null) return false;
      if (propertyValue['ldp:contains']) {
        return this.matchValue(propertyValue['ldp:contains'],filterValue);
      }
      if (Array.isArray(propertyValue)) {
        return propertyValue.reduce(
          (initial, value) => initial || this.matchValue(value, filterValue),
          false,
        );
<<<<<<< HEAD
      }
      if (propertyValue['@id']) {
        //search in ids
=======
      if (propertyValue['@id'])
      //search in ids
>>>>>>> e38ebf298b1e1e8f6961feb1163338fd61259312
        return (
          propertyValue['@id'] == filterValue ||
          propertyValue['@id'] == filterValue['@id']
        );
<<<<<<< HEAD
      }
      if (typeof propertyValue === 'number' || propertyValue instanceof Number) {
        //check if integer match
        return propertyValue == filterValue;
      }
      if (typeof propertyValue === 'string' || propertyValue instanceof String) {
        //search in strings
=======
      if (typeof propertyValue === 'number' || propertyValue instanceof Number)
      //check if integer match
        return propertyValue == filterValue;
      if (typeof propertyValue === 'string' || propertyValue instanceof String)
      //search in strings
>>>>>>> e38ebf298b1e1e8f6961feb1163338fd61259312
        return (
          propertyValue.toLowerCase().indexOf(filterValue.toLowerCase()) != -1
        );
      }
      return false;

    }

    matchFilter(resource, filter, value) {
<<<<<<< HEAD
      console.log('matchFilter', resource, filter);
      if (this.isSet(filter)) {
        // for sets, return true if it matches at least one of the fields
=======
      if (this.isSet(filter))
      // for sets, return true if it matches at least one of the fields
>>>>>>> e38ebf298b1e1e8f6961feb1163338fd61259312
        return this.getSet(filter).reduce(
          (initial, field) =>
          initial || this.matchFilter(resource, field, value),
          false,
        );
      }
      let matched = this.matchValue(resource[filter], value);
      console.log(matched);
      return matched;
    }

    matchFilters(resource) {
      //return true if all filters values are contained in the corresponding field of the resource
      return Object.keys(this.filters).reduce(
        (initial, filter) =>
        initial && this.matchFilter(resource, filter, this.filters[filter]),
        true,
      );
    }

    get resources() {
      // main entry for execute filter and initial populate
      return super.resources.filter(this.matchFilters.bind(this));
    }

    filterList(filters) {
      this.filters = filters;
    }

    appendFilters() {
      const formElt = document.createElement('sib-form');
      formElt.resource = this.resource;
      formElt.save = this.filterList.bind(this);
      formElt.change = this.filterList.bind(this);
      formElt.dataset.fields = this.getAttribute('search-fields');
      formElt.setAttribute('reset', '');

      //displays applied filter values in the form
      for (let filter of Object.keys(this.filters))
        if (formElt.dataset.fields.indexOf(filter) != -1)
          formElt.setAttribute('value-' + filter, this.filters[filter]);

      //pass range attributes
      for (let field of formElt.fields) {
        if (this.hasAttribute('search-range-' + field))
          formElt.setAttribute(
            'range-' + field,
            this.getAttribute('search-range-' + field),
          );
        if (this.hasAttribute('search-widget-' + field))
          formElt.setAttribute(
            'widget-' + field,
            this.getAttribute('search-widget-' + field),
          );
        if (this.hasAttribute('search-label-' + field))
          formElt.setAttribute(
            'label-' + field,
            this.getAttribute('search-label-' + field),
          );
      }

      if (this.shadowRoot)
        this.shadowRoot.insertBefore(formElt, this.shadowRoot.firstChild);
      else this.insertBefore(formElt, this.firstChild);

      this._filtersAdded = true;
    }

    appendSingleElt() {
      this.appendChildElt(this.resource);
    }

    populate() {
      if (this.isContainer) {
        if (!this._filtersAdded && this.hasAttribute('search-fields'))
          this.appendFilters();

        if (this.hasAttribute('counter-template')) {
          const html = evalTemplateString(
<<<<<<< HEAD
            this.getAttribute('counter-template'), {
              counter: this.resources.length
            },
=======
            this.getAttribute('counter-template'),
            {counter: this.resources.length},
>>>>>>> e38ebf298b1e1e8f6961feb1163338fd61259312
          );
          this.div.insertBefore(stringToDom(html), this.div.firstChild);
        }

        for (let resource of this.resources) {
          //for federations, fetch every sib:source we find
          if (resource['@type'] == 'sib:source')
            store.get(resource.container).then(container => {
              for (let resource of container['ldp:contains'])
                this.appendChildElt(resource);
            });
          else this.appendChildElt(resource);
        }
      } else this.appendSingleElt();
    }
  };

class SIBACChecker extends SIBBase {
  get extra_context() {
    return {
      acl: 'http://www.w3.org/ns/auth/acl#',
      permissions: 'acl:accessControl',
      mode: 'acl:mode',
    };
  }

  get permission() {
    return this.getAttribute('permission') || 'view';
  }

  populate() {
    for (let permission of this.resource.permissions) {
      if (permission.mode == this.permission) {
        this.removeAttribute('hidden');
      }
    }
  }

  empty() {
    this.setAttribute('hidden', '');
  }
}

customElements.define('sib-ac-checker', SIBACChecker);


exports.evalTemplateString = evalTemplateString;