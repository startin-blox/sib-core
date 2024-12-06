export const SparqlQueryFactory = {
  makeMetaMetaIndexQuery(forValue: string): string {
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
  },

  makeMetaIndexQuery(forProperty: string, forValue: string): string {
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
  },

  makeMetaIndexStringQuery(forPattern: string): string {
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
  },

  makeIndexQuery(forProperty: string, forValue: string): string {
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
  },

  makeIndexStringQuery(forPattern: string): string {
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
  },

  makeSkillAndCityIndexQuery(skills: string, city: string): string {
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
  },

  makeSkillOrCityAndNameIndexQuery(
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
  },

  makeSkillAndCityAndNameIndexQuery(
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
  },

  makeMetaMetaIndexSkillQuery(): string {
    return SparqlQueryFactory.makeMetaMetaIndexQuery('sib:skills');
  },

  makeMetaIndexSkillQuery(skills: string[]): string {
    return SparqlQueryFactory.makeMetaIndexQuery(
      'sib:skill',
      skills.map(s => `<${s}>`).join(', '),
    );
  },

  makeIndexSkillQuery(skills: string[]): string {
    return SparqlQueryFactory.makeIndexQuery(
      'sib:skill',
      skills.map(s => `<${s}>`).join(', '),
    );
  },

  makeMetaMetaIndexCityQuery(): string {
    return SparqlQueryFactory.makeMetaMetaIndexQuery('sib:cities');
  },

  makeMetaMetaIndexFirstNameQuery(): string {
    return SparqlQueryFactory.makeMetaMetaIndexQuery('sib:first_name');
  },

  makeMetaMetaIndexLastNameQuery(): string {
    return SparqlQueryFactory.makeMetaMetaIndexQuery('sib:last_name');
  },

  makeMetaIndexCityQuery(city: string): string {
    return SparqlQueryFactory.makeMetaIndexQuery(
      'sib:city',
      `"${city.toLowerCase()}"`,
    );
  },

  makeMetaIndexNameQuery(names: string[]): string {
    return SparqlQueryFactory.makeMetaIndexStringQuery(
      names.map(n => `"${n}.*"`).join(', '),
    );
  },

  makeIndexCityQuery(city: string): string {
    return SparqlQueryFactory.makeIndexQuery(
      'sib:city',
      `"${city.toLowerCase()}"`,
    );
  },

  makeIndexNameQuery(names: string[]): string {
    return SparqlQueryFactory.makeIndexStringQuery(
      names.map(n => `"${n}.*"`).join(', '),
    );
  },

  makeIndexSkillCityQuery(skills: string[], city: string): string {
    return SparqlQueryFactory.makeSkillAndCityIndexQuery(
      skills.map(s => `<${s}>`).join(', '),
      `"${city.toLowerCase()}"`,
    );
  },

  makeIndexSkillFirstNameQuery(skills: string[], patterns: string[]): string {
    return SparqlQueryFactory.makeSkillOrCityAndNameIndexQuery(
      'sib:skill',
      skills.map(s => `<${s}>`).join(', '),
      patterns.map(p => `"${p}.*"`).join(', '),
      'sib:firstName',
    );
  },

  makeIndexSkillLastNameQuery(skills: string[], patterns: string[]): string {
    return SparqlQueryFactory.makeSkillOrCityAndNameIndexQuery(
      'sib:skill',
      skills.map(s => `<${s}>`).join(', '),
      patterns.map(p => `"${p}.*"`).join(', '),
      'sib:lastName',
    );
  },

  makeIndexCityFirstNameQuery(city: string, patterns: string[]): string {
    return SparqlQueryFactory.makeSkillOrCityAndNameIndexQuery(
      'sib:city',
      `"${city.toLocaleLowerCase()}"`,
      patterns.map(p => `"${p}.*"`).join(', '),
      'sib:firstName',
    );
  },

  makeIndexCityLastNameQuery(city: string, patterns: string[]): string {
    return SparqlQueryFactory.makeSkillOrCityAndNameIndexQuery(
      'sib:city',
      `"${city.toLocaleLowerCase()}"`,
      patterns.map(p => `"${p}.*"`).join(', '),
      'sib:lastName',
    );
  },

  makeIndexSkillAndCityFirstNameQuery(
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
  },

  makeIndexSkillAndCityLastNameQuery(
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
  },
};
