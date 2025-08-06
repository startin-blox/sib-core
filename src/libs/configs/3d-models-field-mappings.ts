import type { FieldMappings } from '../natural-language-search.ts';

/**
 * Field mappings for 3D Models domain
 * This configuration defines how extracted entities map to store query parameters
 */
export const THREE_D_MODELS_FIELD_MAPPINGS: FieldMappings = {
  title: {
    dataSrcIndex: "http://localhost:5173/examples/data/ai/3DObjects-title-index.jsonld",
    dataRdfType: "tc:3DObject",
    propertyName: "tc:title"
  },
  country: {
    dataSrcIndex: "http://localhost:5173/examples/data/ai/3DObjects-country-index.jsonld", 
    dataRdfType: "tc:3DObject",
    propertyName: "schema:location"
  },
  format: {
    dataSrcIndex: "http://localhost:5173/examples/data/ai/3DObjects-format-index.jsonld",
    dataRdfType: "tc:3DObject", 
    propertyName: "dcat:format"
  },
  publisher: {
    dataSrcIndex: "http://localhost:5173/examples/data/ai/3DObjects-publisher-index.jsonld",
    dataRdfType: "tc:3DObject",
    propertyName: "dcat:publisher"
  },
  licence: {
    dataSrcIndex: "http://localhost:5173/examples/data/ai/3DObjects-licence-index.jsonld",
    dataRdfType: "tc:3DObject",
    propertyName: "dc:license"
  }
};

/**
 * NER labels configuration for 3D Models domain
 */
export const THREE_D_MODELS_NER_LABELS = [
  "O", 
  "B-title", 
  "B-country", 
  "B-format", 
  "B-publisher", 
  "B-licence"
];

/**
 * Example usage of the 3D Models field mappings
 */
export const THREE_D_MODELS_CONFIG = {
  fieldMappings: THREE_D_MODELS_FIELD_MAPPINGS,
  nerLabels: THREE_D_MODELS_NER_LABELS,
  domain: "3d-models"
}; 