/**
 * Configuration for NER model CDN URLs
 * This centralizes the model paths to make them easier to manage and update
 */

export const NER_MODEL_CONFIG = {
  // CDN base URL for NER models
  baseUrl: 'https://cdn.startinblox.com/models/3dobjects/search/models/',

  // Model paths
  tokenizerPath: 'ner_tokenizer',
  modelPath:
    'https://cdn.startinblox.com/models/3dobjects/search/models/ner_model_quantized.onnx',

  // Alternative model paths (for different domains or models)
  alternatives: {
    documents: {
      tokenizerPath:
        'https://cdn.startinblox.com/models/documents/search/models/ner_tokenizer/',
      modelPath:
        'https://cdn.startinblox.com/models/documents/search/models/ner_model_quantized.onnx',
    },
    products: {
      tokenizerPath:
        'https://cdn.startinblox.com/models/products/search/models/ner_tokenizer/',
      modelPath:
        'https://cdn.startinblox.com/models/products/search/models/ner_model_quantized.onnx',
    },
  },
};

/**
 * Get model configuration for a specific domain
 * @param domain - The domain name (e.g., '3dobjects', 'documents', 'products')
 * @returns Model configuration for the specified domain
 */
export function getModelConfig(domain = '3dobjects') {
  if (domain === '3dobjects') {
    return {
      tokenizerPath: NER_MODEL_CONFIG.tokenizerPath,
      modelPath: NER_MODEL_CONFIG.modelPath,
      baseUrl: NER_MODEL_CONFIG.baseUrl,
    };
  }

  const alternative = NER_MODEL_CONFIG.alternatives[domain];
  if (alternative) {
    return alternative;
  }

  // Fallback to default 3D objects model
  console.warn(
    `No model configuration found for domain '${domain}', using default 3D objects model`,
  );
  return {
    tokenizerPath: NER_MODEL_CONFIG.tokenizerPath,
    modelPath: NER_MODEL_CONFIG.modelPath,
  };
}

/**
 * Update the base URL for all models
 * @param newBaseUrl - New base URL for the CDN
 */
export function updateBaseUrl(newBaseUrl: string) {
  NER_MODEL_CONFIG.baseUrl = newBaseUrl;
  NER_MODEL_CONFIG.tokenizerPath = `${newBaseUrl}ner_tokenizer/`;
  NER_MODEL_CONFIG.modelPath = `${newBaseUrl}ner_model_quantized.onnx`;
}
