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

}