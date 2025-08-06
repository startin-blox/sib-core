# Natural Language Search Integration for SIB Core

This integration enables natural language search capabilities for the SIB Core system by combining Named Entity Recognition (NER) with the existing semantic search infrastructure. The system is now **generic** and allows components to provide their own field mappings.

## Overview

The natural language search system allows users to search for any type of content using free-form text prompts. The system is domain-agnostic and can be configured for different types of content:

- **3D Models**: "Show me a 3D model of a castle in France, in glTF format, published by Arctur, under CC0 license."
- **Documents**: "Find a document about machine learning written by John Smith in English, published in 2023."
- **Any Domain**: Components can define their own entity types and field mappings

## Architecture

### Core Components

1. **Generic NER Model** (`src/libs/natural-language-search.ts`): A reusable BERT model wrapper that extracts structured entities from natural language
2. **Domain Configurations** (`src/libs/configs/`): Component-specific field mappings and NER labels
3. **Integration Examples**: HTML examples showing how to use the system with different domains

### Data Flow

```
Natural Language Prompt
         ↓
    NER Model (BERT)
         ↓
   Extracted Entities
         ↓
   Component Field Mappings
         ↓
   Store.queryIndex()
         ↓
   Semantic Search Results
```

## Setup Instructions

### 1. Model Files

The NER models are hosted on CDN and automatically loaded. The system uses the following CDN URLs:

- **Tokenizer**: `https://cdn.startinblox.com/models/3dobjects/search/models/ner_tokenizer/`
- **Model**: `https://cdn.startinblox.com/models/3dobjects/search/models/ner_model_quantized.onnx`

For different domains, you can use alternative model paths:
- **Documents**: `https://cdn.startinblox.com/models/documents/search/models/`
- **Products**: `https://cdn.startinblox.com/models/products/search/models/`

### 2. Load ONNX Runtime

Add the ONNX Runtime script tag to your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js"></script>
```

This makes the `ort` object available globally as `window.ort`.

### 3. Import the Generic Module

```typescript
import { naturalLanguageSearch, search, extractSearchParams } from ../../src/libs/natural-language-search.ts';
import type { FieldMappings, NERConfig } from ../../src/libs/natural-language-search.ts';
import { getModelConfig } from ../../src/libs/configs/ner-model-config.ts';
```

### 4. Create Domain-Specific Configuration

```typescript
// src/libs/configs/my-domain-field-mappings.ts
import type { FieldMappings } from '../natural-language-search.ts';

export const MY_DOMAIN_FIELD_MAPPINGS: FieldMappings = {
  title: {
    dataSrcIndex: "http://localhost:5173/examples/data/my-domain/title-index.jsonld",
    dataRdfType: "schema:Thing",
    propertyName: "schema:name"
  },
  author: {
    dataSrcIndex: "http://localhost:5173/examples/data/my-domain/author-index.jsonld",
    dataRdfType: "schema:Thing", 
    propertyName: "schema:author"
  }
  // ... more mappings
};

export const MY_DOMAIN_NER_LABELS = [
  "O", 
  "B-title", 
  "B-author"
  // ... more labels
];
```

### 5. Initialize with Domain Configuration

```typescript
// Get model configuration for your domain
const modelConfig = getModelConfig('3dobjects'); // or 'documents', 'products'
```

### 6. Title Transformation

For title-like fields (`title` and `product`), the system automatically transforms extracted values into 3-character patterns for querying:

- **Input**: "swimming pool" → **Output**: "swi.*"
- **Input**: "castle" → **Output**: "cas.*" 
- **Input**: "ban" → **Output**: "ban.*"
- **Input**: "smartphone" → **Output**: "sma.*"

This transformation ensures compatibility with the semantizer index structure that uses 3-character patterns for efficient querying.

// Get the ONNX Runtime instance from the global scope
const ort = window.ort;
if (!ort) {
  throw new Error("ONNX Runtime not loaded. Make sure the script tag is present.");
}

// Initialize with domain-specific configuration
await naturalLanguageSearch.initialize({
  labels: MY_DOMAIN_NER_LABELS,
  tokenizerPath: modelConfig.tokenizerPath,
  modelPath: modelConfig.modelPath,
  ort: ort  // Pass the ONNX Runtime instance
});
```

## Usage Examples

### Basic Search with Domain Mappings

```typescript
// Import your domain configuration
import { MY_DOMAIN_FIELD_MAPPINGS } from ../../src/libs/configs/my-domain-field-mappings.ts';

// Search using domain-specific field mappings
const results = await naturalLanguageSearch.search(
  "Find a document about AI written by John Smith",
  MY_DOMAIN_FIELD_MAPPINGS
);
```

### Extract Parameters Only

```typescript
// Extract search parameters without performing the search
const params = await naturalLanguageSearch.extractSearchParams(
  "I need a document about machine learning written by Jane Doe"
);
console.log(params);
// Output: { title: "machine learning", author: "Jane Doe" }
```

### Integration with filterMixin

```typescript
// Create a custom filter mixin that supports natural language
class EnhancedFilterMixin {
  constructor() {
    this.fieldMappings = MY_DOMAIN_FIELD_MAPPINGS;
  }

  async triggerNaturalLanguageSearch(prompt) {
    // Extract parameters
    const searchParams = await naturalLanguageSearch.extractSearchParams(prompt);
    
    // Convert to filter values using domain mappings
    const filterValues = this.convertToFilterValues(searchParams);
    
    // Use existing filterMixin logic
    return await this.triggerIndexSearch(filterValues);
  }
  
  convertToFilterValues(searchParams) {
    const filterValues = {};
    
    // Map extracted parameters to filter values using domain mappings
    for (const [entityType, value] of Object.entries(searchParams)) {
      if (this.fieldMappings[entityType]) {
        const propertyName = this.fieldMappings[entityType].propertyName;
        filterValues[propertyName] = value;
      }
    }
    
    return filterValues;
  }
}
```

### Multiple Domain Support

```typescript
// Support multiple domains in the same application
import { THREE_D_MODELS_CONFIG } from ../../src/libs/configs/3d-models-field-mappings.ts';
import { DOCUMENTS_CONFIG } from ../../src/libs/configs/documents-field-mappings.ts';

class MultiDomainSearch {
  async search3DModels(prompt) {
    return await naturalLanguageSearch.search(prompt, THREE_D_MODELS_CONFIG.fieldMappings);
  }
  
  async searchDocuments(prompt) {
    return await naturalLanguageSearch.search(prompt, DOCUMENTS_CONFIG.fieldMappings);
  }
}
```

## Domain Configuration Structure

### Field Mappings Interface

```typescript
interface FieldMapping {
  dataSrcIndex: string;    // URL to the index file
  dataRdfType: string;     // RDF type to filter on
  propertyName: string;    // Property name to search
}

interface FieldMappings {
  [entityType: string]: FieldMapping;
}
```

### Example Configurations

#### 3D Models Domain
```typescript
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
  }
  // ... more mappings
};
```

#### Documents Domain
```typescript
export const DOCUMENTS_FIELD_MAPPINGS: FieldMappings = {
  title: {
    dataSrcIndex: "http://localhost:5173/examples/data/documents/documents-title-index.jsonld",
    dataRdfType: "schema:Document",
    propertyName: "schema:name"
  },
  author: {
    dataSrcIndex: "http://localhost:5173/examples/data/documents/documents-author-index.jsonld",
    dataRdfType: "schema:Document",
    propertyName: "schema:author"
  }
  // ... more mappings
};
```

## Supported Entity Types

The NER model can be configured to recognize any entity types. Common patterns include:

| Entity Type | Example Values | Use Case |
|-------------|----------------|----------|
| `title` | "castle", "document", "image" | Object names |
| `author` | "John Smith", "Arctur" | Creators/publishers |
| `location` | "France", "New York" | Geographic locations |
| `format` | "glTF", "PDF", "JPEG" | File formats |
| `date` | "2023", "January 2024" | Temporal information |
| `subject` | "machine learning", "architecture" | Topics/themes |

## Configuration

### NER Configuration

```typescript
interface NERConfig {
  labels?: string[];           // NER labels for the domain
  tokenizerPath?: string;      // Path to tokenizer
  modelPath?: string;          // Path to ONNX model
}
```

### Dynamic Label Updates

```typescript
// Update labels at runtime if needed
naturalLanguageSearch.updateLabels([
  "O", 
  "B-title", 
  "B-author", 
  "B-subject"
]);

// Get current labels
const currentLabels = naturalLanguageSearch.currentLabels;
```

## Error Handling

The system provides comprehensive error handling:

```typescript
try {
  const results = await naturalLanguageSearch.search(prompt, fieldMappings);
  // Handle results
} catch (error) {
  if (error.message.includes("not initialized")) {
    // Handle initialization error
    await naturalLanguageSearch.initialize(config);
  } else if (error.message.includes("Search failed")) {
    // Handle search error
    console.error("Search failed:", error.message);
  }
}
```

## Performance Considerations

1. **Model Loading**: The NER model is loaded once during initialization
2. **Caching**: Results are not cached by default, implement caching if needed
3. **Batch Processing**: For multiple queries, consider batching them
4. **Memory Usage**: The ONNX model uses approximately 4.3MB of memory
5. **Domain Switching**: Field mappings can be changed without reinitializing the model

## Browser Compatibility

The system requires:
- ES6 modules support
- Fetch API
- WebAssembly support (for ONNX Runtime)

## Troubleshooting

### Common Issues

1. **Model not loading**: Check that the model files are accessible via HTTP
2. **CORS errors**: Ensure the model files are served from the same domain or with proper CORS headers
3. **Memory issues**: The model requires sufficient memory for initialization
4. **Wrong field mappings**: Ensure your field mappings match the extracted entity types

### Debug Mode

Enable debug logging:

```typescript
// Add this before initialization
console.log = (...args) => {
  if (args[0]?.includes?.('NER') || args[0]?.includes?.('Search')) {
    console.log(...args);
  }
};
```

## Examples

See the following example files:
- `solid-search-prompt-integration.html`: Basic integration example with 3D models
- `solid-search-prompt-filter-integration.html`: Integration with filterMixin

## Contributing

To extend the system:

1. **Add new domains**: Create new field mapping configurations
2. **Custom models**: Train new NER models and update the initialization
3. **Additional entity types**: Extend the NER labels and field mappings
4. **New search strategies**: Implement custom search logic using the extracted parameters

## License

This integration follows the same license as the main SIB Core project. 