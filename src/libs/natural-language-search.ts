import type { IndexQueryOptions } from './store/impl/ldp/LdpStore.ts';
import { hasQueryIndex } from './store/shared/types.ts';
import { StoreService } from './store/storeService.ts';

const store = StoreService.getInstance();

export interface FieldMapping {
  dataSrcIndex: string;
  dataRdfType: string;
  propertyName: string;
  exactMatch?: boolean; // Whether this field should use exact matching instead of pattern matching
}

export interface FieldMappings {
  [entityType: string]: FieldMapping;
}

export interface SearchParams {
  [entityType: string]: string;
}

export interface SearchResult {
  '@id': string;
  [key: string]: any;
}

export interface NERResult {
  [label: string]: string[];
}

export interface NERConfig {
  labels: string[]; // Required - no defaults
  baseUrl: string;
  tokenizerPath?: string;
  modelPath?: string;
  ort?: any; // ONNX Runtime instance
}

export class NaturalLanguageSearch {
  private tokenizer: any = null;
  private session: any = null;
  private isInitialized = false;
  private labels: string[] = [];
  private ort: any = null;

  /**
   * Initialize the NER model
   * @param config - Configuration for the NER model (labels are required)
   */
  async initialize(config: NERConfig): Promise<void> {
    if (!config.labels || config.labels.length === 0) {
      throw new Error('Labels are required for NER model initialization');
    }

    try {
      const {
        labels,
        baseUrl,
        tokenizerPath = 'ner_tokenizer',
        modelPath = '/ner_model_quantized.onnx',
        ort = (window as any).ort,
      } = config;

      this.labels = [...labels];
      this.ort = ort;
      // Check if ONNX Runtime is available
      if (!this.ort) {
        throw new Error(
          "ONNX Runtime (ort) is required. Please provide it in the config or ensure it's loaded globally.",
        );
      }

      // Dynamically import the tokenizer
      // @ts-ignore
      const transformersUrl =
        'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.5.0';
      const { env, AutoTokenizer } = await import(transformersUrl);
      env.localModelPath = baseUrl;
      this.tokenizer = await AutoTokenizer.from_pretrained(tokenizerPath);
      this.session = await this.ort.InferenceSession.create(modelPath);
      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize NER model: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Apply the NER model to extract entities from a prompt
   * @param prompt - The natural language prompt
   * @returns Extracted entities grouped by label
   */
  async applyModel(prompt: string): Promise<NERResult> {
    if (!this.isInitialized) {
      throw new Error('NER model not initialized. Call initialize() first.');
    }

    if (this.labels.length === 0) {
      throw new Error(
        'No labels configured. Please initialize with valid labels.',
      );
    }

    if (!this.ort) {
      throw new Error(
        'ONNX Runtime not available. Please provide it during initialization.',
      );
    }

    const tensor = await this.tokenizer(prompt);
    const inputLen = tensor.input_ids.data.length;

    const output = await this.session.run({
      input_ids: new this.ort.Tensor('int64', tensor.input_ids.data, [
        1,
        inputLen,
      ]),
      attention_mask: new this.ort.Tensor('int64', tensor.attention_mask.data, [
        1,
        inputLen,
      ]),
      token_type_ids: new this.ort.Tensor('int64', tensor.token_type_ids.data, [
        1,
        inputLen,
      ]),
    });

    // Process the output to extract entities
    const [outputLen, numLabels] = output.logits.dims;
    const result: NERResult = {};

    for (let i = 0; i < outputLen; i++) {
      const predictions = output.logits.cpuData.slice(
        numLabels * i,
        numLabels * (i + 1),
      );
      const label = this.labels[predictions.indexOf(Math.max(...predictions))];
      const token = this.tokenizer.decode([tensor.input_ids.data[i]]);

      if (!(label in result)) result[label] = [];
      result[label].push(token);
    }

    return result;
  }

  /**
   * Convert NER results to search parameters
   * @param result - NER model output
   * @returns Structured search parameters
   */
  getSearchParams(result: NERResult): SearchParams {
    const searchObj: SearchParams = {};

    for (const label of this.labels) {
      const [field] = label.split('-');
      if (field && label in result) {
        searchObj[field] = result[label].join(' ').replaceAll(' ##', '');
      }
    }

    return searchObj;
  }

  /**
   * Transform a title into a 3-character pattern for querying
   * @param title - The title extracted from the prompt
   * @returns 3-character pattern like "xxx" (without .* as it's added by the SHACL template)
   */
  private transformTitleToPattern(title: string): string {
    // Take the first 3 characters of the title, convert to lowercase
    const pattern = title.toLowerCase().substring(0, 3);
    return pattern;
  }

  /**
   * Convert search parameters to store query options using provided field mappings
   * @param searchParams - Extracted search parameters
   * @param fieldMappings - Field mappings provided by the component
   * @returns Array of query options for each field
   */
  convertToQueryOptions(
    searchParams: SearchParams,
    fieldMappings: FieldMappings,
  ): IndexQueryOptions[] {
    const queryOptions: IndexQueryOptions[] = [];

    for (const [entityType, value] of Object.entries(searchParams)) {
      if (value && fieldMappings[entityType]) {
        const mapping = fieldMappings[entityType];

        // Transform value based on exactMatch configuration
        let transformedValue = value;
        if (!mapping.exactMatch) {
          // Use pattern matching for title-like fields when exactMatch is false
          transformedValue = this.transformTitleToPattern(value);
        }

        // Determine if this field should use exact matching based on field mapping configuration
        const exactMatchMapping: Record<string, boolean> = {};
        if (mapping.exactMatch) {
          exactMatchMapping[mapping.propertyName] = true;
        }

        queryOptions.push({
          dataSrcIndex: mapping.dataSrcIndex,
          dataRdfType: mapping.dataRdfType,
          filterValues: {
            [mapping.propertyName]: { value: transformedValue },
          },
          exactMatchMapping:
            Object.keys(exactMatchMapping).length > 0
              ? exactMatchMapping
              : undefined,
        });
      }
    }

    return queryOptions;
  }

  /**
   * Perform natural language search using the store with custom field mappings
   * @param prompt - Natural language prompt
   * @param fieldMappings - Field mappings provided by the component
   * @returns Array of matching resources
   */
  async search(
    prompt: string,
    fieldMappings: FieldMappings,
  ): Promise<SearchResult[]> {
    try {
      // Step 1: Extract entities using NER
      const nerResult = await this.applyModel(prompt);
      const searchParams = this.getSearchParams(nerResult);

      // Step 2: Convert to query options using provided mappings
      const queryOptions = this.convertToQueryOptions(
        searchParams,
        fieldMappings,
      );

      if (queryOptions.length === 0) {
        return [];
      }

      // Step 3: Execute queries
      const allResults: SearchResult[] = [];

      for (const options of queryOptions) {
        try {
          if (!hasQueryIndex(store)) {
            throw new Error('Store does not support queryIndex method');
          }
          const results = await store.queryIndex(options);
          allResults.push(...results);
        } catch (error) {
          console.error(`Error querying ${options.dataSrcIndex}:`, error);
        }
      }

      // Step 4: Remove duplicates and return results
      return this.removeDuplicates(allResults);
    } catch (error) {
      throw new Error(
        `Search failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Remove duplicate resources based on @id
   * @param resources - Array of resources
   * @returns Array with duplicates removed
   */
  private removeDuplicates(resources: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return resources.filter(resource => {
      const id = resource['@id'] || resource.id;
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  /**
   * Get the current initialization status
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Extract search parameters from a prompt without performing the search
   * @param prompt - Natural language prompt
   * @returns Extracted search parameters
   */
  async extractSearchParams(prompt: string): Promise<SearchParams> {
    const nerResult = await this.applyModel(prompt);
    return this.getSearchParams(nerResult);
  }

  /**
   * Get the current labels being used by the NER model
   */
  get currentLabels(): string[] {
    return [...this.labels];
  }

  /**
   * Update the labels used by the NER model
   * @param labels - New labels to use
   */
  updateLabels(labels: string[]): void {
    if (!labels || labels.length === 0) {
      throw new Error('Labels cannot be empty');
    }
    this.labels = [...labels];
  }

  /**
   * Validate that the provided field mappings are compatible with current labels
   * @param fieldMappings - Field mappings to validate
   * @returns Array of validation errors (empty if valid)
   */
  validateFieldMappings(fieldMappings: FieldMappings): string[] {
    const errors: string[] = [];
    const availableEntityTypes = this.labels
      .map(label => label.split('-')[1])
      .filter(Boolean);

    for (const entityType of availableEntityTypes) {
      if (!fieldMappings[entityType]) {
        errors.push(`Missing field mapping for entity type: ${entityType}`);
      }
    }

    for (const entityType of Object.keys(fieldMappings)) {
      if (!availableEntityTypes.includes(entityType)) {
        errors.push(
          `Field mapping for '${entityType}' has no corresponding NER label`,
        );
      }
    }

    return errors;
  }
}

// Export a singleton instance
export const naturalLanguageSearch = new NaturalLanguageSearch();

// Export utility functions that require field mappings
export const extractSearchParams = (prompt: string) =>
  naturalLanguageSearch.extractSearchParams(prompt);
export const search = (prompt: string, fieldMappings: FieldMappings) =>
  naturalLanguageSearch.search(prompt, fieldMappings);
