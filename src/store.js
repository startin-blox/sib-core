import './legacy/ldpframework.js';

const Store = window.MyStore; // eslint-disable-line no-unused-vars

export const baseContext = {
  '@vocab': 'http://happy-dev.fr/owl/#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  ldp: 'http://www.w3.org/ns/ldp#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  name: 'rdfs:label',
};

export const store = new window.MyStore({
  context: baseContext,
  defaultSerializer: 'application/ld+json',
});
