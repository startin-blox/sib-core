export class SparqlQueryFactory {

    public static make(type: string, attributes: any): string {
        switch (type) {
            case "user":
                return SparqlQueryFactory.makeUser(attributes);
        
            default:
                return "";
        }
    }
    
    public static makeUser(searchFormResource: any): string {
        let query = `PREFIX : <http://happy-dev.fr/owl/#>
          SELECT ?user 
          WHERE { 
            ?user :profile ?profile.
        `;

        if (searchFormResource["skills"] && searchFormResource["skills"].value.length > 0) {
            query += `\t?user :skills ${searchFormResource["skills"].value.map((s: string) => "<" + s["@id"] + ">")}`;
            query += '.\n';   
        }

        if (searchFormResource["profile.city"] && searchFormResource["profile.city"].value !== "") {
            query += `\t?profile :city "${searchFormResource["profile.city"].value}".`
        }
        
        query += `            
          }
        `;

        return query;
    }

    public static makeUserInit(): string {
        return `PREFIX ex: <https://example.org#>
        SELECT ?`;
    }

    public static makeSkillMetaIndex(): string {
        return `PREFIX ex: <https://example.org#>
        PREFIX ns1: <https://cdn.startinblox.com/owl/ttl/vocab.ttl#> 
        SELECT ?result 
        WHERE {
            ?registration a ex:PropertyIndexRegistration;
            ex:forProperty ex:forProperty;
            ex:forValue ns1:hasSkill;
            ex:instancesIn ?result.
        }`;
    }

    public static makeSkillIndex(skill: string): string {
        return `PREFIX ex: <https://example.org#>
        PREFIX ns1: <https://cdn.startinblox.com/owl/ttl/vocab.ttl#> 
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        SELECT ?result 
        WHERE {
            ?registration a ex:PropertyIndexRegistration;
            ex:forProperty ns1:hasSkill;
            ex:forValue <${skill}>;
            rdfs:seeAlso ?result.
        }`;
    }

    public static makeSkill(skill: string): string {
        return `PREFIX ex: <https://example.org#>
        PREFIX ns1: <https://cdn.startinblox.com/owl/ttl/vocab.ttl#> 
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        SELECT ?result 
        WHERE {
            ?index a ex:PropertyIndex;
            ex:forProperty ns1:hasSkill;
            ex:forValue <${skill}>;
            ex:instance ?result.
        }`;
    }

}