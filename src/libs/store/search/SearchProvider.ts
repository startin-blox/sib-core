import type {
  ConjunctionQueryOptions,
  IndexQueryOptions,
} from '../LdpStore.ts';

export interface SearchProvider {
  /**
   * Query an index using SHACL shapes and return matching resources
   * @param options - Query options including data source, RDF type, and filter values
   * @returns Promise resolving to an array of matching resources
   */
  query(options: IndexQueryOptions): Promise<any[]>;

  /**
   * Query multiple fields and find intersection (conjunction) of results
   * @param options - Conjunction query options with multiple filter values
   * @returns Promise<any[]> - Array of matching resources that satisfy ALL criteria
   */
  queryConjunction(options: ConjunctionQueryOptions): Promise<any[]>;

  /**
   * Validate if a string is a valid URL
   * @param url - The URL string to validate
   * @returns true if valid, false otherwise
   */
  isValidUrl(url: string): boolean;
}
