# SIB Core - Semantic Indexing & Natural Language Search System

## Overview

SIB Core implements a sophisticated semantic search system that combines SHACL-based hierarchical indexing, Natural Language Processing (NER), and RDF/JSON-LD data to enable efficient searching through structured data with natural language queries.

## Index Hierarchy Structure

The system uses a 5-level hierarchical index structure based on the `/examples/data/ai` implementation:

### Level 0: Federation Registry (Participant Discovery)
```jsonld
{
  "@id": "https://federation.example/registry", 
  "@type": "idx:FederationIndex",
  "participants": [
    {
      "domain": "3DObjects",
      "rootIndex": "http://localhost:5173/examples/data/ai/3DObjects-index.jsonld",
      "searchCapabilities": ["semantic", "api"]
    }
  ]
}
```

### Level 1: Domain Property Index (`3DObjects-index.jsonld`)
Enumerates all searchable properties for a domain:
```jsonld
{
  "@graph": [
    {
      "@type": "idx:Index",
      "@id": "http://localhost:5173/examples/data/ai/3DObjects-index.jsonld"
    },
    {
      "@id": "3DObjects-index.jsonld#title",
      "@type": "idx:IndexEntry",
      "idx:hasShape": {
        "sh:property": [
          {"@id": "#target"}, // rdf:type = tc:3DObject
          {"sh:path": "tc:title"}
        ]
      },
      "idx:hasSubIndex": "http://localhost:5173/examples/data/ai/3DObjects-title-index.jsonld"
    },
    {
      "@id": "3DObjects-index.jsonld#country",
      "@type": "idx:IndexEntry",
      "idx:hasSubIndex": "http://localhost:5173/examples/data/ai/3DObjects-country-index.jsonld"
    }
    // ... publisher, format, time_period
  ]
}
```

### Level 2: Property Value Pattern Index (`3DObjects-title-index.jsonld`)
Maps value patterns to specific pattern indexes:
```jsonld
{
  "@graph": [
    {
      "@type": "idx:Index",
      "@id": "http://localhost:5173/examples/data/ai/3DObjects-title-index.jsonld"
    },
    {
      "@id": "3DObjects-title-index.jsonld#cas",
      "@type": "idx:IndexEntry",
      "idx:hasShape": {
        "sh:property": [
          {"sh:path": "rdf:type", "sh:hasValue": "tc:3DObject"},
          {"sh:path": "tc:title", "sh:pattern": "cas.*"}
        ]
      },
      "idx:hasSubIndex": "http://localhost:5173/examples/data/ai/titles/cas.jsonld"
    }
    // ... other patterns (for.*, pal.*, etc.)
  ]
}
```

### Level 3: Pattern Target Index (`titles/cas.jsonld`)
Contains all resources matching a specific pattern:
```jsonld
{
  "@graph": [
    {
      "@id": "http://localhost:5173/examples/data/ai/titles/cas.jsonld",
      "@type": "idx:Index"
    },
    // SHARED SHAPE for all entries in this pattern
    {
      "@id": "cas.jsonld#target",
      "@type": "sh:NodeShape",
      "sh:closed": "false",
      "sh:property": [
        {"sh:path": "rdf:type", "sh:hasValue": {"@id": "tc:3DObject"}},
        {"sh:path": "tc:title", "sh:pattern": "cas.*"}
      ]
    },
    // MULTIPLE ENTRIES all using the same shape, different targets
    {
      "@id": "cas.jsonld#0",
      "@type": "idx:IndexEntry",
      "idx:hasShape": "cas.jsonld#target",
      "idx:hasTarget": "http://localhost:5173/examples/data/ai/3DObjects/106.jsonld"
    },
    {
      "@id": "cas.jsonld#1",
      "@type": "idx:IndexEntry", 
      "idx:hasShape": "cas.jsonld#target",
      "idx:hasTarget": "http://localhost:5173/examples/data/ai/3DObjects/111.jsonld"
    }
    // ... up to 9 castle entries
  ]
}
```

### Level 4: Actual Data Resources (`3DObjects/106.jsonld`)
The final data resources containing the actual content.

## Natural Language Processing

### Components
- **NER Model**: BERT-based Named Entity Recognition
- **Entity Extraction**: Extracts structured entities from natural language
- **Pattern Transformation**: Converts entities to 3-character patterns (e.g., "castle" → "cas")
- **Field Mappings**: Maps entity types to RDF properties

### Implementation Files
- `src/libs/natural-language-search.ts`: Core NER functionality
- `src/libs/store/search/SolidIndexingSearchProvider.ts`: SHACL-based querying
- `examples/ai/solid-search-prompt-integration.html`: Working example

### Example Flow
```
"Show me a castle in France" 
→ NER extracts: {title: "castle", country: "France"}
→ Transform: title="castle" → pattern="cas.*"
→ Query: 3DObjects-index → title property → title-index → cas pattern → cas.jsonld → targets
→ Fetch: 3DObjects/106.jsonld, 3DObjects/111.jsonld, etc.
→ Results: Complete castle resources
```

## Hybrid Architecture: Semantic Indexes + APIs

The system supports adding simple APIs at any level while maintaining semantic capabilities:

### Enhanced Structure with APIs
```jsonld
{
  "@graph": [
    {
      "@type": "idx:Index",
      "@id": "3DObjects-index.jsonld",
      // Domain-level API
      "searchEndpoint": "http://localhost:5173/api/3dobjects/search",
      "searchCapabilities": ["multi-property", "conjunction"]
    },
    {
      "@id": "3DObjects-index.jsonld#title",
      "@type": "idx:IndexEntry",
      "idx:hasSubIndex": "3DObjects-title-index.jsonld",
      // Property-level API
      "searchEndpoint": "http://localhost:5173/api/titles/search"
    }
  ]
}
```

### Search Strategy
```javascript
class HybridSearch {
  async search(query, options) {
    // 1. Discover capabilities at each level
    // 2. Try API first (faster, simpler)
    // 3. Fallback to semantic index (more powerful)
    // 4. Intersect results for multi-property queries
  }
}
```

## Key Benefits

### Discoverability & Decentralization
- **Federated Discovery**: Participants register in federation indexes
- **Autonomous Participation**: Each participant maintains data sovereignty
- **Cross-Institutional Search**: Single queries span multiple institutions
- **Network Effect**: Self-expanding discoverable network

### Performance & Flexibility
- **Fast Queries**: Pre-computed indexes enable quick lookups
- **Natural Language**: Users can search conversationally
- **Semantic Understanding**: Handles synonyms and complex relationships
- **Progressive Enhancement**: Can add APIs without breaking semantic functionality

### Real-World Applications
- Cultural heritage networks (museums, libraries, archives)
- Academic research collaborations
- Open data ecosystems
- Solid Pod networks

## vs. Centralized API Approach

| Aspect | Centralized API | Federated Indexes |
|--------|-----------------|-------------------|
| **Data Ownership** | Central authority | Distributed sovereignty |
| **Discoverability** | Limited to central knowledge | Automatic network discovery |
| **Scalability** | Central bottleneck | Distributed load |
| **Resilience** | Single point of failure | Network continues if nodes fail |
| **Innovation** | Central control | Independent innovation |

## Implementation Notes

- Uses W3C standards (RDF, SHACL, JSON-LD)
- Supports BERT-based NER with ONNX Runtime
- Semantizer library for SHACL querying
- Pattern-based efficient indexing (3-character prefixes)
- Handles both exact matching and pattern matching
- Multi-criteria conjunction queries supported

## File Locations

### Core Implementation
- `src/libs/natural-language-search.ts`
- `src/libs/store/search/SolidIndexingSearchProvider.ts` 
- `src/libs/store/LdpStore.ts`

### Examples & Data
- `examples/data/ai/` - Complete index hierarchy examples
- `examples/ai/` - Working HTML examples and documentation
- `examples/data/solid-traversal-search/` - Federation examples

### Key Example Files
- `3DObjects-index.jsonld` - Level 1: Domain properties
- `3DObjects-title-index.jsonld` - Level 2: Pattern mapping  
- `titles/cas.jsonld` - Level 3: Pattern results
- `3DObjects/106.jsonld` - Level 4: Actual data

This system enables sophisticated semantic search while maintaining the flexibility to add simpler API approaches where beneficial, creating a best-of-both-worlds architecture for federated, discoverable knowledge networks.