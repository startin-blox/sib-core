import type { FieldMappings } from '../natural-language-search.ts';

/**
 * Field mappings for Documents domain
 * This configuration defines how extracted entities map to store query parameters
 */
export const DOCUMENTS_FIELD_MAPPINGS: FieldMappings = {
  title: {
    dataSrcIndex:
      'http://localhost:5173/examples/data/documents/documents-title-index.jsonld',
    dataRdfType: 'schema:Document',
    propertyName: 'schema:name',
  },
  author: {
    dataSrcIndex:
      'http://localhost:5173/examples/data/documents/documents-author-index.jsonld',
    dataRdfType: 'schema:Document',
    propertyName: 'schema:author',
  },
  subject: {
    dataSrcIndex:
      'http://localhost:5173/examples/data/documents/documents-subject-index.jsonld',
    dataRdfType: 'schema:Document',
    propertyName: 'schema:about',
  },
  language: {
    dataSrcIndex:
      'http://localhost:5173/examples/data/documents/documents-language-index.jsonld',
    dataRdfType: 'schema:Document',
    propertyName: 'schema:inLanguage',
  },
  date: {
    dataSrcIndex:
      'http://localhost:5173/examples/data/documents/documents-date-index.jsonld',
    dataRdfType: 'schema:Document',
    propertyName: 'schema:datePublished',
  },
};

/**
 * NER labels configuration for Documents domain
 */
export const DOCUMENTS_NER_LABELS = [
  'O',
  'B-title',
  'B-author',
  'B-subject',
  'B-language',
  'B-date',
];

/**
 * Example usage of the Documents field mappings
 */
export const DOCUMENTS_CONFIG = {
  fieldMappings: DOCUMENTS_FIELD_MAPPINGS,
  nerLabels: DOCUMENTS_NER_LABELS,
  domain: 'documents',
};
