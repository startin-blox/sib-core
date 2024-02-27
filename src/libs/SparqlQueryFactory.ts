export class SparqlQueryFactory {

    public static makeMetaMetaIndexQuery(forValue: string): string {
        return `PREFIX ex: <https://example.org#>
        PREFIX ns1: <https://cdn.startinblox.com/owl/ttl/vocab.ttl#> 
        SELECT ?result 
        WHERE {
            ?registration a ex:PropertyIndexRegistration;
            ex:forProperty ex:forProperty;
            ex:forValue ${forValue};
            ex:instancesIn ?result.
        }`;
    }

    public static makeMetaIndexQuery(forProperty: string, forValue: string): string {
        return `PREFIX ex: <https://example.org#>
        PREFIX ns1: <https://cdn.startinblox.com/owl/ttl/vocab.ttl#> 
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        SELECT ?result 
        WHERE {
            ?registration a ex:PropertyIndexRegistration;
            ex:forProperty ${forProperty};
            ex:forValue ?value;
            rdfs:seeAlso ?result.
            FILTER (?value IN (${forValue}))
        }`;
    }

    public static makeIndexQuery(forProperty: string, forValue: string): string {
        return `PREFIX ex: <https://example.org#>
        PREFIX ns1: <https://cdn.startinblox.com/owl/ttl/vocab.ttl#> 
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        SELECT ?result 
        WHERE {
            ?index a ex:PropertyIndex;
            ex:forProperty ${forProperty};
            ex:forValue ?value;
            ex:instance ?result.
            FILTER (?value IN (${forValue}))
        }`;
    }

    public static makeMixedIndexQuery(skills: string, city: string): string {
        return `PREFIX ex: <https://example.org#>
        PREFIX ns1: <https://cdn.startinblox.com/owl/ttl/vocab.ttl#> 
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        SELECT ?result 
        WHERE {
            ?skillIndex a ex:PropertyIndex;
            ex:forProperty ns1:hasSkill;
            ex:forValue ?skill;
            ex:instance ?result.
            ?cityIndex a ex:PropertyIndex;
            ex:forProperty ns1:hasLocation;
            ex:forValue ${city};
            ex:instance ?result.
            FILTER (?skill IN (${skills}))
        }`;
    }

    public static makeMetaMetaIndexSkillQuery(): string {
        return SparqlQueryFactory.makeMetaMetaIndexQuery("ns1:hasSkill");
    }

    public static makeMetaIndexSkillQuery(skills: string[]): string {
        return SparqlQueryFactory.makeMetaIndexQuery("ns1:hasSkill", skills.map(s => `<${s}>`).join(', '));
    }

    public static makeIndexSkillQuery(skills: string[]): string {
        return SparqlQueryFactory.makeIndexQuery("ns1:hasSkill", skills.map(s => `<${s}>`).join(', '));
    }

    public static makeMetaMetaIndexCityQuery(): string {
        return SparqlQueryFactory.makeMetaMetaIndexQuery("ns1:hasLocation");
    }

    public static makeMetaIndexCityQuery(city: string): string {
        return SparqlQueryFactory.makeMetaIndexQuery("ns1:hasLocation", `"${city}"`);
    }

    public static makeIndexCityQuery(city: string): string {
        return SparqlQueryFactory.makeIndexQuery("ns1:hasLocation", `"${city}"`);
    }

    public static makeIndexSkillCityQuery(skills: string[], city: string): string {
        return SparqlQueryFactory.makeMixedIndexQuery(skills.map(s => `<${s}>`).join(', '), `"${city}"`);
    }
}