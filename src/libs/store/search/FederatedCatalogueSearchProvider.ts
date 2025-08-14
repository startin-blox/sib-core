import type {
  ConjunctionQueryOptions,
  IndexQueryOptions,
} from '../LdpStore.ts';
import type { SearchProvider } from './SearchProvider.ts';

export interface FederatedCatalogueConfig {
  endpoint: string;
  queryLanguage?: 'OpenCypher' | 'SPARQL' | 'GraphQL';
  timeout?: number;
  withTotalCount?: boolean;
  headers?: Record<string, string>;
}

export interface QueryStatement {
  statement: string;
  parameters?: Record<string, any>;
}

export interface AnnotatedStatement extends QueryStatement {
  servers?: string[];
  queryLanguage?: string;
  timeout?: number;
}

export interface QueryResults {
  items: any[];
  totalCount?: number;
}

export class FederatedCatalogueSearchProvider implements SearchProvider {
  private config: FederatedCatalogueConfig;

  constructor(config: FederatedCatalogueConfig) {
    this.config = {
      queryLanguage: 'OpenCypher',
      timeout: 5,
      withTotalCount: true,
      ...config,
    };
  }

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
   * Query the federated catalogue using OpenCypher or SPARQL
   * @param options - Query options including data source, RDF type, and filter values
   * @returns Promise resolving to an array of matching resources
   */
  async query(options: IndexQueryOptions): Promise<any[]> {
    console.log(
      '🔍 [FederatedCatalogueSearchProvider.query] Starting query with options:',
      JSON.stringify(options, null, 2),
    );

    try {
      const queryStatement = this.buildQuery(options);
      const results = await this.executeQuery(queryStatement);

      console.log(
        `✅ [FederatedCatalogueSearchProvider.query] Found ${results.items.length} results`,
      );

      return results.items;
    } catch (error) {
      console.error(
        '❌ [FederatedCatalogueSearchProvider.query] Error in federated query:',
        error,
      );
      throw error;
    }
  }

  /**
   * Query multiple fields and find intersection (conjunction) of results
   * @param options - Conjunction query options with multiple filter values
   * @returns Promise<any[]> - Array of matching resources that satisfy ALL criteria
   */
  async queryConjunction(options: ConjunctionQueryOptions): Promise<any[]> {
    console.log(
      '🔍 [FederatedCatalogueSearchProvider.queryConjunction] Starting conjunction query',
    );

    const filterFields = Object.entries(options.filterValues);

    if (filterFields.length === 0) {
      return [];
    }

    try {
      // Build a single query with AND conditions for all filter fields
      const queryStatement = this.buildConjunctionQuery(options);
      const results = await this.executeQuery(queryStatement);

      console.log(
        `✅ [FederatedCatalogueSearchProvider.queryConjunction] Found ${results.items.length} results`,
      );

      return results.items;
    } catch (error) {
      console.error(
        '❌ [FederatedCatalogueSearchProvider.queryConjunction] Error in conjunction query:',
        error,
      );
      throw error;
    }
  }

  /**
   * Execute a distributed search across federated catalogue servers
   * @param statement - The annotated statement for distributed search
   * @returns Promise resolving to query results
   */
  async querySearch(statement: AnnotatedStatement): Promise<QueryResults> {
    const url = `${this.config.endpoint}/query/search`;

    const requestBody = {
      ...statement,
      queryLanguage: statement.queryLanguage || this.config.queryLanguage,
      timeout: statement.timeout || this.config.timeout,
    };

    console.log(
      '🌐 [FederatedCatalogueSearchProvider.querySearch] Executing distributed search:',
      requestBody,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Federated search failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  /**
   * Execute a local catalogue query
   * @param statement - The query statement
   * @returns Promise resolving to query results
   */
  private async executeQuery(statement: QueryStatement): Promise<QueryResults> {
    const url = `${this.config.endpoint}/query`;

    const params = new URLSearchParams({
      queryLanguage: this.config.queryLanguage || 'OpenCypher',
      timeout: (this.config.timeout || 5).toString(),
      withTotalCount: (this.config.withTotalCount !== false).toString(),
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(statement),
    });

    if (!response.ok) {
      throw new Error(
        `Query failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  /**
   * Build a query statement based on IndexQueryOptions
   * @param options - Query options
   * @returns Query statement
   */
  private buildQuery(options: IndexQueryOptions): QueryStatement {
    const filterFields = Object.entries(options.filterValues);
    const firstField = filterFields[0];
    const [propertyName, filterValue] = firstField;
    const searchValue = (filterValue as any).value;

    if (this.config.queryLanguage === 'SPARQL') {
      return this.buildSparqlQuery(
        options.dataRdfType,
        propertyName,
        searchValue,
        options.exactMatchMapping,
      );
    }
    // Default to OpenCypher
    return this.buildOpenCypherQuery(
      options.dataRdfType,
      propertyName,
      searchValue,
      options.exactMatchMapping,
    );
  }

  /**
   * Build a conjunction query for multiple filter conditions
   * @param options - Conjunction query options
   * @returns Query statement
   */
  private buildConjunctionQuery(
    options: ConjunctionQueryOptions,
  ): QueryStatement {
    const filterFields = Object.entries(options.filterValues);

    if (this.config.queryLanguage === 'SPARQL') {
      return this.buildSparqlConjunctionQuery(
        options.dataRdfType,
        filterFields,
        options.exactMatchMapping,
      );
    }
    // Default to OpenCypher
    return this.buildOpenCypherConjunctionQuery(
      options.dataRdfType,
      filterFields,
      options.exactMatchMapping,
    );
  }

  /**
   * Build an OpenCypher query
   */
  private buildOpenCypherQuery(
    rdfType: string,
    propertyName: string,
    searchValue: string,
    exactMatchMapping?: Record<string, boolean>,
  ): QueryStatement {
    const isExactMatch = exactMatchMapping?.[propertyName];
    const matchCondition = isExactMatch
      ? `n.${propertyName} = $searchValue`
      : `n.${propertyName} CONTAINS $searchValue`;

    const statement = `
      MATCH (n)
      WHERE n.type = $rdfType AND ${matchCondition}
      RETURN n
    `;

    return {
      statement,
      parameters: {
        rdfType,
        searchValue,
      },
    };
  }

  /**
   * Build an OpenCypher conjunction query
   */
  private buildOpenCypherConjunctionQuery(
    rdfType: string,
    filterFields: [string, any][],
    exactMatchMapping?: Record<string, boolean>,
  ): QueryStatement {
    const conditions = filterFields.map(([propertyName], index) => {
      const isExactMatch = exactMatchMapping?.[propertyName];
      const paramName = `searchValue${index}`;
      return isExactMatch
        ? `n.${propertyName} = $${paramName}`
        : `n.${propertyName} CONTAINS $${paramName}`;
    });

    const statement = `
      MATCH (n)
      WHERE n.type = $rdfType AND ${conditions.join(' AND ')}
      RETURN n
    `;

    const parameters: Record<string, any> = { rdfType };
    filterFields.forEach(([, filterValue], index) => {
      parameters[`searchValue${index}`] = (filterValue as any).value;
    });

    return {
      statement,
      parameters,
    };
  }

  /**
   * Build a SPARQL query
   */
  private buildSparqlQuery(
    rdfType: string,
    propertyName: string,
    searchValue: string,
    exactMatchMapping?: Record<string, boolean>,
  ): QueryStatement {
    const isExactMatch = exactMatchMapping?.[propertyName];

    // Convert property name to proper RDF predicate if needed
    const predicate = propertyName.includes(':')
      ? propertyName
      : `rdfs:${propertyName}`;

    const filterCondition = isExactMatch
      ? `FILTER(?value = "${searchValue}")`
      : `FILTER(CONTAINS(LCASE(?value), LCASE("${searchValue}")))`;

    const statement = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      
      SELECT ?subject ?predicate ?object WHERE {
        ?subject rdf:type <${rdfType}> .
        ?subject <${predicate}> ?value .
        ${filterCondition}
        ?subject ?predicate ?object .
      }
    `;

    return { statement };
  }

  /**
   * Build a SPARQL conjunction query
   */
  private buildSparqlConjunctionQuery(
    rdfType: string,
    filterFields: [string, any][],
    exactMatchMapping?: Record<string, boolean>,
  ): QueryStatement {
    const filterConditions = filterFields.map(
      ([propertyName, filterValue], index) => {
        const isExactMatch = exactMatchMapping?.[propertyName];
        const predicate = propertyName.includes(':')
          ? propertyName
          : `rdfs:${propertyName}`;
        const varName = `value${index}`;
        const searchValue = (filterValue as any).value;

        const condition = isExactMatch
          ? `FILTER(?${varName} = "${searchValue}")`
          : `FILTER(CONTAINS(LCASE(?${varName}), LCASE("${searchValue}")))`;

        return {
          triple: `?subject <${predicate}> ?${varName} .`,
          filter: condition,
        };
      },
    );

    const triples = filterConditions.map(c => c.triple).join('\n        ');
    const filters = filterConditions.map(c => c.filter).join('\n        ');

    const statement = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      
      SELECT ?subject ?predicate ?object WHERE {
        ?subject rdf:type <${rdfType}> .
        ${triples}
        ${filters}
        ?subject ?predicate ?object .
      }
    `;

    return { statement };
  }
}
