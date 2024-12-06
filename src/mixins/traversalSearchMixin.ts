import { parseFieldsString } from '../libs/helpers.ts';
//import { QueryEngine } from '@comunica/query-sparql-link-traversal';

const TraversalSearchMixin = {
  name: 'traversal-search-mixin',
  use: [],
  initialState: {
    searchCount: null,
    engine: null,
    results: [],
  },
  attributes: {
    values: {
      type: Array,
      default: [],
    },
    results: {
      type: Array,
      default: [],
      callback(newValue: []) {
        // if results are refreshed, re-populate
        console.log('Results changed, repopulate');
        if (newValue) {
          console.log('Results changed, repopulate');
          this.populate();
        }
      },
    },
  },
  created() {
    this.searchCount = new Map();
    this.engine = undefined; //new QueryEngine();
    this.element.addEventListener('populate', () => {
      console.log(this.results);
    });
  },
  async triggerTraversalSearch(): Promise<void> {
    console.log(this.element);
    console.log('Fields', this.fields);
    // Get all values from all fields in the form
    // Add that to a values[] arrayconst fields = Object.keys(filters);
    const fields = parseFieldsString(this.fields);
    for (const field of fields) {
      console.log(
        field,
        this.element.querySelector(`[name="${field}"] input`).value,
      );
      this.values[field] = [];

      const valuesArray = parseFieldsString(
        this.element.querySelector(`[name="${field}"] input`).value,
      );
      for (const value of valuesArray) {
        this.values[field].push(value);
      }
    }

    const query = `SELECT DISTINCT ?user ?first_name ?last_name WHERE {
      ?skillIndex a <https://cdn.startinblox.com/owl#PropertyIndex>;
      <https://cdn.startinblox.com/owl#hasEntry> ?user.

      ?user <https://cdn.startinblox.com/owl#first_name> ?first_name;
      <https://cdn.startinblox.com/owl#last_name> ?last_name;
    } LIMIT 100`;

    // TODO: check the URL is a container.
    const indexDirectory = this.element.attributes['data-src'].value; // data-src value

    const makeSources = (indexes: string[]) =>
      indexes.map(index => `${indexDirectory}${index}.jsonld`);

    const bindingsStream = await this.engine.queryBindings(query, {
      lenient: true, // ignore HTTP fails
      sources: makeSources(this.values.skills),
    });

    console.log('Start querying...');

    bindingsStream.on('data', (binding: any) => {
      const user = {
        '@id': binding.get('user').value,
        first_name: binding.get('first_name').value,
        last_name: binding.get('last_name').value,
      };

      console.log('Found new user', user);

      this.results.push(user);
      console.log(this.results);
      this.populate();
    });

    bindingsStream.on('end', () => {
      console.log('Query terminated');
      console.log(this.results);
    });

    bindingsStream.on('error', (error: Error) => {
      console.log(error);
    });
  },
  attached(): void {
    this.element.addEventListener('formChange', () =>
      this.triggerTraversalSearch(),
    );
  },
};

export { TraversalSearchMixin };
