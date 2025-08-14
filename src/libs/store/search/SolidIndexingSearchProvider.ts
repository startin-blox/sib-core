import type {
  ConjunctionQueryOptions,
  IndexQueryOptions,
} from '../LdpStore.ts';
import type { SearchProvider } from './SearchProvider.ts';

// Semantizer imports
import {
  EntryStreamTransformerDefaultImpl,
  indexFactory,
} from '@semantizer/mixin-index';
import type { NamedNode } from '@semantizer/types';
import {
  IndexQueryingStrategyShaclUsingFinalIndex,
  IndexStrategyFinalShapeDefaultImpl,
} from '@semantizer/util-index-querying-strategy-shacl-final';
import { ValidatorImpl } from '@semantizer/util-shacl-validator-default';
import N3 from 'n3';

export class SolidIndexingSearchProvider implements SearchProvider {
  constructor(private dataFetcher: (id: string) => Promise<any>) {}

  /**
   * Validate if a string is a valid URL
   * @param url - The URL string to validate
   * @returns true if valid, false otherwise
   */
  isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if either dataSrcIndex or dataSrcProfile is a valid URL
   * @param options - Query options including data source, RDF type, and filter values
   * @returns true if either dataSrcIndex or dataSrcProfile is a valid URL, false otherwise
   */
  hasValidIndexUrl(options: IndexQueryOptions): boolean {
    return (
      this.isValidUrl(options.dataSrcIndex ?? '') ||
      this.isValidUrl(options.dataSrcProfile ?? '')
    );
  }

  /**
   * Query an index using SHACL shapes and return matching resources
   * @param options - Query options including data source, RDF type, and filter values
   * @returns Promise resolving to an array of matching resources
   */
  async query(options: IndexQueryOptions): Promise<any[]> {
    // Validate dataSrcIndex before proceeding
    let indexUri: string;

    // Path 1: Direct index specification
    if (options.dataSrcIndex) {
      indexUri = options.dataSrcIndex;
      console.log('📂 [SolidIndexingSearchProvider.queryIndex] Using direct index URI:', indexUri);
    }
    // Path 2: Profile-based discovery
    else if (options.dataSrcProfile) {
      indexUri = await this.discoverIndexFromProfile(options.dataSrcProfile);
      console.log('🔍 [SolidIndexingSearchProvider.queryIndex] Discovered index URI from profile:', indexUri);
    }
    else {
      console.warn('Either dataSrcIndex or dataSrcProfile must be specified');
      return [];
    }

    // Validate the discovered/resolved URI
    if (!this.isValidUrl(indexUri)) {
      console.warn('⚠️ [SolidIndexingSearchProvider.queryIndex] Invalid index URI, returning empty results');
      return [];
    }

    console.log(
      '🔍 [SolidIndexingSearchProvider.queryIndex] Starting query with options:',
      JSON.stringify(options, null, 2),
    );

    console.log(
      '🔍 [SolidIndexingSearchProvider.queryIndex] Filter values:',
      JSON.stringify(options.filterValues, null, 2),
    );

    const filterFields = Object.entries(options.filterValues);
    console.log(
      '🔍 [SolidIndexingSearchProvider.queryIndex] Filter fields:',
      filterFields,
    );

    const firstField = filterFields[0];
    const firstFieldValue = firstField[1] as { value: string };

    let path = firstField[0];
    let fieldName = path;

    // Handle nested paths (e.g., "nested.field")
    if (path.includes('.') && !path.includes(':')) {
      // Split the path on each dots
      const fieldPath: string[] = path.split('.');
      // Get last path
      path = fieldPath.pop() as string;
      fieldName = path.replace(/_([a-z])/g, g => g[1].toUpperCase());
    } else if (path.includes(':')) {
      // Handle prefixed URIs (e.g., "schema:location")
      fieldName = path; // Keep the full prefixed URI
    } else {
      // Handle simple field names
      fieldName = path.replace(/_([a-z])/g, g => g[1].toUpperCase());
    }

    const searchPattern = firstFieldValue.value as string;

    console.log(
      '🔍 [SolidIndexingSearchProvider.queryIndex] Parsed parameters:',
    );
    console.log('  - Path:', path);
    console.log('  - Field name:', fieldName);
    console.log('  - Search pattern:', searchPattern);
    console.log('  - RDF type:', options.dataRdfType);
    console.log('  - Exact match mapping:', options.exactMatchMapping);

    // Generate shapes dynamically
    console.log(
      '🔧 [SolidIndexingSearchProvider.queryIndex] Generating SHACL shapes...',
    );
    const { targetShape, subIndexShape, finalShape } = this.generateShapes(
      options.dataRdfType,
      fieldName,
      searchPattern,
      options.exactMatchMapping,
    );

    console.log(
      '📝 [SolidIndexingSearchProvider.queryIndex] Generated shapes:',
    );
    console.log('=== TARGET SHAPE ===');
    console.log(targetShape);
    console.log('=== SUBINDEX SHAPE ===');
    console.log(subIndexShape);
    console.log('=== FINAL SHAPE ===');
    console.log(finalShape);

    const parser = new N3.Parser({ format: 'text/turtle' });
    const targetShapeGraph = SEMANTIZER.build();
    targetShapeGraph.addAll(parser.parse(targetShape));

    const finalIndexShapeGraph = SEMANTIZER.build();
    finalIndexShapeGraph.addAll(parser.parse(finalShape));

    const subIndexShapeGraph = SEMANTIZER.build();
    subIndexShapeGraph.addAll(parser.parse(subIndexShape));

    const shaclValidator = new ValidatorImpl();
    const entryTransformer = new EntryStreamTransformerDefaultImpl(SEMANTIZER);

    const finalIndexStrategy = new IndexStrategyFinalShapeDefaultImpl(
      finalIndexShapeGraph,
      subIndexShapeGraph,
      shaclValidator,
      entryTransformer,
    );
    const shaclStrategy = new IndexQueryingStrategyShaclUsingFinalIndex(
      targetShapeGraph,
      finalIndexStrategy,
      shaclValidator,
      entryTransformer,
    );

    console.log(
      '🔧 [SolidIndexingSearchProvider.queryIndex] Creating index with factory...',
    );
    const index = await SEMANTIZER.load(indexUri, indexFactory);
    console.log(
      '✅ [SolidIndexingSearchProvider.queryIndex] Index created successfully',
    );

    console.log(
      '🚀 [SolidIndexingSearchProvider.queryIndex] Starting query stream...',
    );
    const resultStream = index.mixins.index.query(shaclStrategy);

    return new Promise<any[]>((resolve, reject) => {
      const resultIds: string[] = [];
      const resources: any[] = [];
      let pendingFetches = 0;
      let streamEnded = false;

      const checkComplete = () => {
        if (streamEnded && pendingFetches === 0) {
          console.log(
            `🏁 [SolidIndexingSearchProvider.queryIndex] All resources fetched. Found ${resultIds.length} result IDs:`,
            resultIds,
          );
          console.log(
            `🎯 [SolidIndexingSearchProvider.queryIndex] Returning ${resources.length} resources for ldp:contains`,
          );
          resolve(resources);
        }
      };

      resultStream.on('data', async (result: NamedNode) => {
        console.log(
          '📦 [SolidIndexingSearchProvider.queryIndex] Received result:',
          result.value,
        );
        if (result.value) {
          resultIds.push(result.value);
          console.log(
            '✅ [SolidIndexingSearchProvider.queryIndex] Added result ID:',
            result.value,
          );

          pendingFetches++;
          try {
            const resource = await this.dataFetcher(result.value);
            if (resource) {
              resources.push(resource);
              console.log(
                `✅ [SolidIndexingSearchProvider.queryIndex] Successfully fetched resource: ${result.value}`,
              );
            } else {
              console.warn(
                `⚠️ [SolidIndexingSearchProvider.queryIndex] Could not fetch resource: ${result.value}`,
              );
            }
          } catch (error) {
            console.error(
              `❌ [SolidIndexingSearchProvider.queryIndex] Error fetching resource ${result.value}:`,
              error,
            );
          } finally {
            pendingFetches--;
            checkComplete();
          }
        }
      });

      resultStream.on('error', error => {
        console.error(
          '❌ [SolidIndexingSearchProvider.queryIndex] Error in index query:',
          error,
        );
        reject(error);
      });

      resultStream.on('end', () => {
        console.log(
          `🏁 [SolidIndexingSearchProvider.queryIndex] Stream ended. Found ${resultIds.length} result IDs:`,
          resultIds,
        );
        streamEnded = true;
        checkComplete();
      });
    });
  }

  /**
   * Query multiple fields and find intersection (conjunction) of results
   * @param options - Conjunction query options with multiple filter values
   * @returns Promise<any[]> - Array of matching resources that satisfy ALL criteria
   */
  async queryConjunction(options: ConjunctionQueryOptions): Promise<any[]> {
    // Validate dataSrcIndex before proceeding
    if (!this.hasValidIndexUrl(options)) {
      console.warn(
        '⚠️ [SolidIndexingSearchProvider.queryIndexConjunction] Invalid index URL:',
        options.dataSrcIndex,
        options.dataSrcProfile,
      );
      return [];
    }

    console.log(
      '🔍 [SolidIndexingSearchProvider.queryIndexConjunction] Starting conjunction query with options:',
      JSON.stringify(options, null, 2),
    );

    const filterFields = Object.entries(options.filterValues);
    console.log(
      '🔍 [SolidIndexingSearchProvider.queryIndexConjunction] Filter fields:',
      filterFields,
    );

    if (filterFields.length === 0) {
      return [];
    }

    // Execute individual queries for each field
    const queryPromises = filterFields.map(([propertyName, filterValue]) => {
      const queryOptions: IndexQueryOptions = {
        dataSrcIndex: options.dataSrcIndex,
        dataRdfType: options.dataRdfType,
        filterValues: {
          [propertyName]: filterValue,
        },
        exactMatchMapping: options.exactMatchMapping,
      };

      console.log(
        `🔍 [SolidIndexingSearchProvider.queryIndexConjunction] Executing query for ${propertyName}:`,
        queryOptions,
      );
      return this.query(queryOptions);
    });

    try {
      // Wait for all queries to complete
      const allResults = await Promise.all(queryPromises);
      console.log(
        '🔍 [SolidIndexingSearchProvider.queryIndexConjunction] All individual queries completed',
      );

      // Find intersection (resources that appear in ALL result sets)
      if (allResults.length === 1) {
        return allResults[0];
      }

      // Get the first result set as the base
      const baseResults = allResults[0];

      console.log(
        `🔍 [SolidIndexingSearchProvider.queryIndexConjunction] Base results count: ${baseResults.length}`,
      );

      // Check which resources exist in ALL result sets
      const intersectionResults = baseResults.filter((resource: any) => {
        const resourceId = resource['@id'];
        console.log(
          `🔍 [SolidIndexingSearchProvider.queryIndexConjunction] Checking resource: ${resourceId}`,
        );

        const existsInAllSets = allResults.every((resultSet, index) => {
          const found = resultSet.some((r: any) => r['@id'] === resourceId);
          console.log(
            `  - Set ${index}: ${found ? '✅' : '❌'} (${resultSet.length} items)`,
          );
          return found;
        });

        console.log(
          `  - Final result: ${existsInAllSets ? '✅ IN INTERSECTION' : '❌ NOT IN INTERSECTION'}`,
        );
        return existsInAllSets;
      });

      console.log(
        `🔍 [SolidIndexingSearchProvider.queryIndexConjunction] Conjunction results count: ${intersectionResults.length}`,
      );
      return intersectionResults;
    } catch (error) {
      console.error(
        '❌ [SolidIndexingSearchProvider.queryIndexConjunction] Error in conjunction query:',
        error,
      );
      throw error;
    }
  }

  /**
   * Generate SHACL shapes dynamically based on query parameters
   * @param rdfType - The RDF type to filter on
   * @param propertyName - The property name to search
   * @param pattern - The search pattern
   * @param exactMatchMapping - Optional mapping of property names to exact match flags (uses sh:hasValue instead of sh:pattern)
   * @returns Object containing target, subindex, and final shapes
   */
  private generateShapes(
    rdfType: string,
    propertyName: string,
    pattern: string,
    exactMatchMapping?: Record<string, boolean>,
  ) {
    console.log(
      '🔧 [SolidIndexingSearchProvider.generateShapes] Generating shapes with parameters:',
    );
    console.log('  - RDF Type:', rdfType);
    console.log('  - Property Name:', propertyName);
    console.log('  - Pattern:', pattern);
    console.log('  - Exact Match Mapping:', exactMatchMapping);

    // Determine if this property should use exact matching
    const isExactMatch = exactMatchMapping?.[propertyName];

    // For exact matching, use sh:pattern with case-insensitive regex for case-insensitive exact matching
    // This handles both case sensitivity and provides standard SHACL compliance
    // Note: Some SHACL engines may not support (?i) flags, so we use lowercase pattern
    // Try simple pattern matching without regex anchors for better compatibility
    let matchValue: string;
    if (isExactMatch) {
      // Exact match: use the pattern as-is, converted to lowercase
      matchValue = pattern.toLowerCase();
    } else {
      // Pattern match: extract meaningful prefix and add wildcard
      // Remove special characters and extract first few meaningful characters
      const cleanPattern = pattern
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim(); // Remove leading/trailing spaces

      // Extract first meaningful word (at least 3 characters)
      const words = cleanPattern.split(' ').filter(word => word.length >= 3);
      const prefix =
        words.length > 0 ? words[0].substring(0, 3) : pattern.substring(0, 3);

      matchValue = `${prefix}.*`;

      console.log('  - Cleaned pattern:', cleanPattern);
      console.log('  - Extracted words:', words);
      console.log('  - Generated prefix:', prefix);
    }

    const matchConstraint = 'sh:pattern';

    console.log('  - Is Exact Match:', isExactMatch);
    console.log('  - Match Value:', matchValue);
    console.log('  - Match Constraint:', matchConstraint);
    console.log(
      '  - Generated SHACL constraint: [ sh:path',
      `${matchConstraint}; sh:hasValue "${matchValue}" ]`,
    );

    const targetShape = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix idx: <https://ns.inria.fr/idx/terms#>.
@prefix sib: <https://cdn.startinblox.com/owl#>.
@prefix tems: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix tc: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix dcat: <http://www.w3.org/ns/dcat#>.
@prefix dct: <http://purl.org/dc/terms/>.

idx:IndexEntry
a rdfs:Class, sh:NodeShape ;
sh:closed false;
sh:property [
  sh:path idx:hasTarget;
    sh:minCount 1;
];
sh:property [
    sh:path idx:hasShape ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:property [
      sh:path sh:property ;
      sh:minCount 1;
        sh:qualifiedValueShape
            [
                sh:and (
                    [ sh:path sh:path ; sh:hasValue rdf:type ]
                    [ sh:path sh:hasValue; sh:hasValue ${rdfType} ]
                )
            ],
            [
                sh:and (
                    [ sh:path sh:path; sh:hasValue ${propertyName} ]
                    [ sh:path ${matchConstraint}; sh:hasValue "${matchValue}"  ]
                )
            ];
  sh:qualifiedMinCount 1 ;
    ];
].
`;

    const subIndexShape = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix idx: <https://ns.inria.fr/idx/terms#>.
@prefix sib: <https://cdn.startinblox.com/owl#>.
@prefix tems: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix tc: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix dcat: <http://www.w3.org/ns/dcat#>.
@prefix dct: <http://purl.org/dc/terms/>.

idx:IndexEntry
a rdfs:Class, sh:NodeShape ;
#sh:closed false;
sh:property [
    sh:path idx:hasSubIndex;
    sh:minCount 1;
];
sh:property [
    sh:path idx:hasShape ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:property [
        sh:path sh:property ;
        sh:minCount 1;
        sh:qualifiedValueShape
            [
                sh:and (
                    [ sh:path sh:path ; sh:hasValue rdf:type ]
                    [ sh:path sh:hasValue; sh:hasValue ${rdfType} ]
                )
            ],
            [
                sh:and (
                    [ sh:path sh:path; sh:hasValue ${propertyName} ]
                    [ sh:path sh:pattern ; sh:maxCount 0 ]
                )
            ];
        sh:qualifiedMinCount 1;
    ]
].`;

    const finalShape = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <http://schema.org/> .
@prefix idx: <https://ns.inria.fr/idx/terms#>.
@prefix sib: <https://cdn.startinblox.com/owl#>.
@prefix tems: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix tc: <https://cdn.startinblox.com/owl/tems.jsonld#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix dcat: <http://www.w3.org/ns/dcat#>.
@prefix dct: <http://purl.org/dc/terms/>.

idx:IndexEntry
a rdfs:Class, sh:NodeShape ;
sh:closed false;
sh:property [
    sh:path idx:hasSubIndex;
    sh:minCount 1;
];
sh:property [
    sh:path idx:hasShape ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:property [
        sh:path sh:property ;
        sh:minCount 1;
        sh:qualifiedValueShape
            [
                sh:and (
                    [ sh:path sh:path ; sh:hasValue rdf:type ]
                    [ sh:path sh:hasValue; sh:hasValue ${rdfType} ]
                )
            ],
            [
                sh:and (
                    [ sh:path sh:path; sh:hasValue ${propertyName} ]
                    [ sh:path ${matchConstraint}; sh:hasValue "${matchValue}"  ]
                )
            ];
        sh:qualifiedMinCount 1 ;
    ];
].
`;

    return { targetShape, subIndexShape, finalShape };
  }

  /**
   * Discover index URI from a profile document through profile traversal
   * @param profileUrl - The profile URL to traverse
   * @returns Promise resolving to the discovered index URI
   */
  private async discoverIndexFromProfile(profileUrl: string): Promise<string> {
    try {
      // 1. Load the profile document
      const profileResponse = await fetch(profileUrl);
      const profileData = await profileResponse.json();

      // 2. Extract the publicTypeIndex URL
      const publicTypeIndexUrl = this.extractPublicTypeIndexUrl(profileData);
      if (!publicTypeIndexUrl) {
        throw new Error('No publicTypeIndex found in profile');
      }

      // 3. Load the publicTypeIndex document
      const typeIndexResponse = await fetch(publicTypeIndexUrl);
      const typeIndexData = await typeIndexResponse.json();

      // 4. Find the first idx:Index instance
      const indexUri = this.extractIndexUri(typeIndexData);
      if (!indexUri) {
        throw new Error('No idx:Index instance found in publicTypeIndex');
      }

      return indexUri;

    } catch (error: any) {
      console.error('Profile discovery failed:', error);
      throw new Error(`Failed to discover index from profile: ${error.message}`);
    }
  }

  /**
   * Extract the publicTypeIndex URL from profile data
   * @param profileData - The parsed profile JSON-LD data
   * @returns The publicTypeIndex URL or null if not found
   */
  private extractPublicTypeIndexUrl(profileData: any): string | null {
    // Look for the profile document with foaf:primaryTopic
    const profileDoc = profileData['@graph']?.find((item: any) =>
      item['@type'] === 'foaf:PersonalProfileDocument'
    );
    console.log('🔍 [SolidIndexingSearchProvider.extractPublicTypeIndexUrl] Profile document:', profileDoc);

    if (profileDoc?.["foaf:primaryTopic"]) {
      const primaryTopicId = profileDoc?.["foaf:primaryTopic"];

      // Find the primary topic document
      const primaryTopic = profileData['@graph']?.find((item: any) =>
        item['@id'] === primaryTopicId
      );

      return primaryTopic?.['solid:publicTypeIndex'] || null;
    }

    return null;
  }

  /**
   * Extract the index URI from type index data
   * @param typeIndexData - The parsed publicTypeIndex JSON-LD data
   * @returns The index URI or null if not found
   */
  private extractIndexUri(typeIndexData: any): string | null {
    // Look for the first registration with solid:forClass = "idx:Index"
    const indexRegistration = typeIndexData['@graph']?.find((item: any) =>
      item['solid:forClass'] === 'idx:Index' &&
      item['solid:instance']
    );

    return indexRegistration?.['solid:instance'] || null;
  }
}
