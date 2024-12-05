export class SparqlQueryFactory {
  public static makeMetaMetaIndexQuery(forValue: string): string {
    return `PREFIX idx: <https://ns.inria.fr/idx/terms#>
        PREFIX sib: <http://cdn.startinblox.com/owl/ttl/vocab.ttl#>
        PREFIX sh: <https://www.w3.org/ns/shacl#>
        SELECT ?result 
        WHERE {
            ?entry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path ${forValue};
                ]
            ];
            idx:hasSubIndex ?result.
        }`;
  }

  public static makeMetaIndexQuery(
    forProperty: string,
    forValue: string,
  ): string {
    return `PREFIX idx: <https://ns.inria.fr/idx/terms#>
        PREFIX sib: <http://cdn.startinblox.com/owl/ttl/vocab.ttl#>
        PREFIX sh: <https://www.w3.org/ns/shacl#>
        SELECT ?result 
        WHERE {
            ?entry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path ${forProperty};
                    sh:hasValue ?value;
                ]
            ];
            idx:hasSubIndex ?result.
            FILTER (?value IN (${forValue}))
        }`;
  }

  public static makeMetaIndexStringQuery(forPattern: string): string {
    return `PREFIX idx: <https://ns.inria.fr/idx/terms#>
        PREFIX sib: <http://cdn.startinblox.com/owl/ttl/vocab.ttl#>
        PREFIX sh: <https://www.w3.org/ns/shacl#>
        SELECT ?result 
        WHERE {
            ?entry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path ?paths;
                    sh:pattern ?patterns;
                ]
            ];
            idx:hasSubIndex ?result.
            FILTER (?patterns IN (${forPattern}))
            FILTER (?paths IN (sib:firstName, sib:lastName))
        } LIMIT 4`;
  }

  public static makeIndexQuery(forProperty: string, forValue: string): string {
    return `PREFIX idx: <https://ns.inria.fr/idx/terms#>
        PREFIX sib: <http://cdn.startinblox.com/owl/ttl/vocab.ttl#>
        PREFIX sh: <https://www.w3.org/ns/shacl#>
        SELECT ?result 
        WHERE {
            ?entry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path ${forProperty};
                    sh:hasValue ?value;
                ]
            ];
            idx:hasTarget ?result.
            FILTER (?value IN (${forValue}))
        } LIMIT 30`;
  }

  public static makeIndexStringQuery(forPattern: string): string {
    return `PREFIX idx: <https://ns.inria.fr/idx/terms#>
        PREFIX sib: <http://cdn.startinblox.com/owl/ttl/vocab.ttl#>
        PREFIX sh: <https://www.w3.org/ns/shacl#>
        SELECT ?result 
        WHERE {
            ?entry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path ?paths;
                    sh:pattern ?patterns;
                ]
            ];
            idx:hasTarget ?result.
            FILTER (?patterns IN (${forPattern}))
            FILTER (?paths IN (sib:firstName, sib:lastName))
        } LIMIT 30`;
  }

  public static makeSkillAndCityIndexQuery(
    skills: string,
    city: string,
  ): string {
    return `PREFIX idx: <https://ns.inria.fr/idx/terms#>
        PREFIX sib: <http://cdn.startinblox.com/owl/ttl/vocab.ttl#>
        PREFIX sh: <https://www.w3.org/ns/shacl#>
        SELECT ?result 
        WHERE {
            ?skillEntry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path sib:skill;
                    sh:hasValue ?skill;
                ]
            ];
            idx:hasTarget ?result.

            ?cityEntry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path sib:city;
                    sh:hasValue ${city};
                ]
            ];
            idx:hasTarget ?result.

            FILTER (?skill IN (${skills}))
        } LIMIT 30`;
  }

  public static makeSkillOrCityAndNameIndexQuery(
    skillOrCityPredicate: string,
    skillsOrCities: string,
    patterns: string,
    namePath: string,
  ): string {
    return `PREFIX idx: <https://ns.inria.fr/idx/terms#>
        PREFIX sib: <http://cdn.startinblox.com/owl/ttl/vocab.ttl#>
        PREFIX sh: <https://www.w3.org/ns/shacl#>
        SELECT ?result 
        WHERE {
            ?skillEntry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path ${skillOrCityPredicate};
                    sh:hasValue ?skillOrCity;
                ]
            ];
            idx:hasTarget ?result.

            ?nameEntry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path ${namePath};
                    sh:pattern ?patterns;
                ]
            ];
            idx:hasTarget ?result.

            FILTER (?skillOrCity IN (${skillsOrCities}))
            FILTER (?patterns IN (${patterns}))
        } LIMIT 30`;
  }

  public static makeSkillAndCityAndNameIndexQuery(
    skills: string,
    city: string,
    patterns: string,
    namePath: string,
  ): string {
    return `PREFIX idx: <https://ns.inria.fr/idx/terms#>
        PREFIX sib: <http://cdn.startinblox.com/owl/ttl/vocab.ttl#>
        PREFIX sh: <https://www.w3.org/ns/shacl#>
        SELECT ?result 
        WHERE {
            ?skillEntry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path sib:skill;
                    sh:hasValue ?skill;
                ]
            ];
            idx:hasTarget ?result.

            ?cityEntry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path sib:city;
                    sh:hasValue "${city.toLocaleLowerCase()}";
                ]
            ];
            idx:hasTarget ?result.

            ?nameEntry a idx:IndexEntry;
            idx:hasShape [
                sh:property [
                    sh:path ${namePath};
                    sh:pattern ?patterns;
                ]
            ];
            idx:hasTarget ?result.

            FILTER (?skill IN (${skills}))
            FILTER (?patterns IN (${patterns}))
        } LIMIT 30`;
  }

  public static makeMetaMetaIndexSkillQuery(): string {
    return SparqlQueryFactory.makeMetaMetaIndexQuery('sib:skills');
  }

  public static makeMetaIndexSkillQuery(skills: string[]): string {
    return SparqlQueryFactory.makeMetaIndexQuery(
      'sib:skill',
      skills.map(s => `<${s}>`).join(', '),
    );
  }

  public static makeIndexSkillQuery(skills: string[]): string {
    return SparqlQueryFactory.makeIndexQuery(
      'sib:skill',
      skills.map(s => `<${s}>`).join(', '),
    );
  }

  public static makeMetaMetaIndexCityQuery(): string {
    return SparqlQueryFactory.makeMetaMetaIndexQuery('sib:cities');
  }

  public static makeMetaMetaIndexFirstNameQuery(): string {
    return SparqlQueryFactory.makeMetaMetaIndexQuery('sib:first_name');
  }

  public static makeMetaMetaIndexLastNameQuery(): string {
    return SparqlQueryFactory.makeMetaMetaIndexQuery('sib:last_name');
  }

  public static makeMetaIndexCityQuery(city: string): string {
    return SparqlQueryFactory.makeMetaIndexQuery(
      'sib:city',
      `"${city.toLowerCase()}"`,
    );
  }

  public static makeMetaIndexNameQuery(names: string[]): string {
    return SparqlQueryFactory.makeMetaIndexStringQuery(
      names.map(n => `"${n}.*"`).join(', '),
    );
  }

  public static makeIndexCityQuery(city: string): string {
    return SparqlQueryFactory.makeIndexQuery(
      'sib:city',
      `"${city.toLowerCase()}"`,
    );
  }

  public static makeIndexNameQuery(names: string[]): string {
    return SparqlQueryFactory.makeIndexStringQuery(
      names.map(n => `"${n}.*"`).join(', '),
    );
  }

  public static makeIndexSkillCityQuery(
    skills: string[],
    city: string,
  ): string {
    return SparqlQueryFactory.makeSkillAndCityIndexQuery(
      skills.map(s => `<${s}>`).join(', '),
      `"${city.toLowerCase()}"`,
    );
  }

  public static makeIndexSkillFirstNameQuery(
    skills: string[],
    patterns: string[],
  ): string {
    return SparqlQueryFactory.makeSkillOrCityAndNameIndexQuery(
      'sib:skill',
      skills.map(s => `<${s}>`).join(', '),
      patterns.map(p => `"${p}.*"`).join(', '),
      'sib:firstName',
    );
  }

  public static makeIndexSkillLastNameQuery(
    skills: string[],
    patterns: string[],
  ): string {
    return SparqlQueryFactory.makeSkillOrCityAndNameIndexQuery(
      'sib:skill',
      skills.map(s => `<${s}>`).join(', '),
      patterns.map(p => `"${p}.*"`).join(', '),
      'sib:lastName',
    );
  }

  public static makeIndexCityFirstNameQuery(
    city: string,
    patterns: string[],
  ): string {
    return SparqlQueryFactory.makeSkillOrCityAndNameIndexQuery(
      'sib:city',
      `"${city.toLocaleLowerCase()}"`,
      patterns.map(p => `"${p}.*"`).join(', '),
      'sib:firstName',
    );
  }

  public static makeIndexCityLastNameQuery(
    city: string,
    patterns: string[],
  ): string {
    return SparqlQueryFactory.makeSkillOrCityAndNameIndexQuery(
      'sib:city',
      `"${city.toLocaleLowerCase()}"`,
      patterns.map(p => `"${p}.*"`).join(', '),
      'sib:lastName',
    );
  }

  public static makeIndexSkillAndCityFirstNameQuery(
    skills: string[],
    city: string,
    patterns: string[],
  ): string {
    return SparqlQueryFactory.makeSkillAndCityAndNameIndexQuery(
      skills.map(s => `<${s}>`).join(', '),
      city,
      patterns.map(p => `"${p}.*"`).join(', '),
      'sib:firstName',
    );
  }

  public static makeIndexSkillAndCityLastNameQuery(
    skills: string[],
    city: string,
    patterns: string[],
  ): string {
    return SparqlQueryFactory.makeSkillAndCityAndNameIndexQuery(
      skills.map(s => `<${s}>`).join(', '),
      city,
      patterns.map(p => `"${p}.*"`).join(', '),
      'sib:lastName',
    );
  }
}
