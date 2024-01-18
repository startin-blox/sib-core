import { parseFieldsString } from '../libs/helpers';
import { QueryEngine } from '@comunica/query-sparql-link-traversal';

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
        console.log("Results changed, repopulate");
        if (newValue) {
          console.log("Results changed, repopulate");
          this.populate();
        }
      }
    },
  },
  created() {
    this.searchCount = new Map();
    this.engine = new QueryEngine();
    this.element.addEventListener('populate', () => {
      console.log(this.results);
    });
  },
  async triggerTraversalSearch(): Promise<void> {
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


    const query = `SELECT DISTINCT ?user ?first_name ?last_name WHERE {
      ?skillIndex a <http://happy-dev.fr/owl/#PropertyIndex>;
      <http://happy-dev.fr/owl/#hasEntry> ?user.

      ?user <http://happy-dev.fr/owl/#first_name> ?first_name;
      <http://happy-dev.fr/owl/#last_name> ?last_name;
    } LIMIT 100`;

    // TODO: check the URL is a container.
    const indexDirectory = this.element.attributes["data-src"].value; // data-src value

    const makeSources = (indexes: string[]) => indexes.map(index => `${indexDirectory}${index}.jsonld`);

    const bindingsStream = await this.engine.queryBindings(query, {
      lenient: true, // ignore HTTP fails
      sources: makeSources(this.values['skills']),
    });

    console.log("Start querying...");

    bindingsStream.on('data', (binding: any) => {
      const user = {
        '@id': binding.get('user').value,
        first_name: binding.get('first_name').value,
        last_name: binding.get('last_name').value
      }

      console.log("Found new user", user);

      this.results.push(user);
      console.log(this.results);
      this.populate();
    });

    bindingsStream.on('end', () => {
      console.log("Query terminated");
      console.log(this.results);
    });

    bindingsStream.on('error', (error: Error) => {
      console.log(error);
    });
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