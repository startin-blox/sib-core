import { QueryEngine } from '@comunica/query-sparql-link-traversal';
import { SparqlQueryFactory } from '../libs/SparqlQueryFactory';

export type SparqlQueryEngineComunicaCallback = (user: string) => Promise<void>;

export class SparqlQueryEngineComunica {

    private engine: any;
    private metaMetaIndex: string;
    private callback: SparqlQueryEngineComunicaCallback;

    public constructor(metaMetaIndex: string, callback: SparqlQueryEngineComunicaCallback) {
        this.engine = new QueryEngine();
        this.metaMetaIndex = metaMetaIndex;
        this.callback = callback;
    }

    private makeBindingsStreamPromise(bindingsStream: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            bindingsStream.on('end', () => resolve());
            bindingsStream.on('error', () => reject());
        });
    }

    private async makeBindingsStream(query: string, source: string): Promise<any> {
        return await this.engine.queryBindings(query, {
            lenient: true, // ignore HTTP fails
            sources: [ source ],
        });
    }

    private async getSingleResultFromBindingsStream(bindingsStream: any): Promise<string> {
        let result = "";
        bindingsStream.on('data', (binding: any) => result = binding.get('result').value);
        await this.makeBindingsStreamPromise(bindingsStream);
        return result;
    }

    private async getResultsFromBindingsStream(bindingsStream: any): Promise<void> {
        bindingsStream.on('data', async (binding: any) => await this.callback(binding.get('result').value));
        await this.makeBindingsStreamPromise(bindingsStream);
    }

    private async getMetaIndex(query: string): Promise<string> {
        const bindingsStream = await this.makeBindingsStream(query, this.metaMetaIndex);
        return await this.getSingleResultFromBindingsStream(bindingsStream);
    }

    private async getIndex(query: string, metaIndex: string): Promise<string> {
        const bindingsStream = await this.makeBindingsStream(query, metaIndex);
        return await this.getSingleResultFromBindingsStream(bindingsStream);
    }

    private async getUsers(query: string, index: string): Promise<void> {
        const bindingsStream = await this.makeBindingsStream(query, index);
        return await this.getResultsFromBindingsStream(bindingsStream);
    }

    public searchBySkill(): void {
        
    }

    public async searchByLocation(location: string): Promise<void> {
        const cityMetaIndex = await this.getMetaIndex(SparqlQueryFactory.makeMetaMetaIndexCityQuery());
        const cityIndex = await this.getIndex(SparqlQueryFactory.makeMetaIndexCityQuery(location), cityMetaIndex);
        this.getUsers(SparqlQueryFactory.makeIndexCityQuery(location), cityIndex);
    }

    public searchBySkillAndLocation(): void {

    }

    public searchFromSearchForm(searchForm: any): void {
        const hasSkill = searchForm["skills"] && searchForm["skills"].value.length > 0;
        const hasCity = searchForm["profile.city"] && searchForm["profile.city"].value.length > 0;

        // searchFormResource["profile.city"].value

        if (hasSkill && !hasCity) {
            this.searchBySkill();
        }

        else if (hasCity && !hasSkill) {
            this.searchByLocation("");
        }

        else if (hasSkill && hasCity) {
            this.searchBySkillAndLocation();
        }
    }

}