import './legacy/ldpframework.js'

const Store = window.MyStore;

export const base_context = {
  '@vocab': 'http://happy-dev.fr/owl/#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  ldp: 'http://www.w3.org/ns/ldp#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  name: 'rdfs:label',
  acl: "http://www.w3.org/ns/auth/acl#",
  '@permissions': "acl:accessControl",
  mode: 'acl:mode'
};

export const store = new window.MyStore({
  context: base_context,
  defaultSerializer: 'application/ld+json',
});
