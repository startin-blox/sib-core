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
            ex:forValue ${forValue};
            rdfs:seeAlso ?result.
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
            ex:forValue ${forValue};
            ex:instance ?result.
        }`;
    }

    public static makeMetaMetaIndexSkillQuery(): string {
        return SparqlQueryFactory.makeMetaMetaIndexQuery("ns1:hasSkill");
    }

    public static makeMetaIndexSkillQuery(skill: string): string {
        return SparqlQueryFactory.makeMetaIndexQuery("ns1:hasSkill", `<${skill}>`);
    }

    public static makeIndexSkillQuery(skill: string): string {
        return SparqlQueryFactory.makeIndexQuery("ns1:hasSkill", `<${skill}>`);
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

}