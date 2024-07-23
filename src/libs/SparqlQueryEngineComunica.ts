import { QueryEngine } from '@comunica/query-sparql';
import { SparqlQueryFactory } from '../libs/SparqlQueryFactory';

export type SparqlQueryEngineComunicaUpdateCallback = (user: string) => Promise<void>;
export type SparqlQueryEngineComunicaResetCallback = () => void;

export class SparqlQueryEngineComunica {

    private engine: any;
    private metaMetaIndex: string;
    private updateCallback: SparqlQueryEngineComunicaUpdateCallback;
    private resetCallback: SparqlQueryEngineComunicaResetCallback;

    public constructor(metaMetaIndex: string, updateCallback: SparqlQueryEngineComunicaUpdateCallback, resetCallback: SparqlQueryEngineComunicaResetCallback) {
        this.engine = new QueryEngine();
        this.metaMetaIndex = "https://api.test-inria-index.startinblox.com/fedex/indexes/users/index"; //metaMetaIndex;
        this.updateCallback = updateCallback;
        this.resetCallback = resetCallback;
    }

    private makeBindingsStreamPromise(bindingsStream: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            bindingsStream.on('end', () => resolve());
            bindingsStream.on('error', () => reject());
        });
    }

    private async makeBindingsStream(query: string, sources: string[]): Promise<any> {
        return await this.engine.queryBindings(query, {
            lenient: true, // ignore HTTP fails
            sources: sources,
        });
    }

    private async getSingleResultFromBindingsStream(bindingsStream: any): Promise<string> {
        let result = "";
        bindingsStream.on('data', (binding: any) => result = binding.get('result').value);
        await this.makeBindingsStreamPromise(bindingsStream);
        return result;
    }

    private async getMultipleResultFromBindingsStream(bindingsStream: any): Promise<string[]> {
        return (await bindingsStream.toArray()).map(b => b.get("result").value)
    }

    private async getResultsFromBindingsStream(bindingsStream: any): Promise<void> {
        let count = 0;
        bindingsStream.on('data', async (binding: any) => {
            count++;
            await this.updateCallback(binding.get('result').value);
        });
        await this.makeBindingsStreamPromise(bindingsStream);
        console.log(count)
        if (count === 0) {
            this.resetCallback();
        }
    }

    private async getMetaIndex(query: string): Promise<string> {
        const bindingsStream = await this.makeBindingsStream(query, [this.metaMetaIndex]);
        return await this.getSingleResultFromBindingsStream(bindingsStream);
    }

    private async getIndex(query: string, metaIndex: string): Promise<string[]> {
        const bindingsStream = await this.makeBindingsStream(query, [metaIndex]);
        return this.getMultipleResultFromBindingsStream(bindingsStream);
    }

    private async getUsers(query: string, indexes: string[]): Promise<void> {
        const bindingsStream = await this.makeBindingsStream(query, indexes);
        return await this.getResultsFromBindingsStream(bindingsStream);
    }

    public async searchBySkill(skills: string[]): Promise<void> {
        const skillMetaIndex = await this.getMetaIndex(SparqlQueryFactory.makeMetaMetaIndexSkillQuery());
        const skillIndexes = await this.getIndex(SparqlQueryFactory.makeMetaIndexSkillQuery(skills), skillMetaIndex);
        this.getUsers(SparqlQueryFactory.makeIndexSkillQuery(skills), skillIndexes);
    }

    public async searchByLocation(location: string): Promise<void> {
        const cityMetaIndex = await this.getMetaIndex(SparqlQueryFactory.makeMetaMetaIndexCityQuery());
        const cityIndexes = await this.getIndex(SparqlQueryFactory.makeMetaIndexCityQuery(location), cityMetaIndex);
        this.getUsers(SparqlQueryFactory.makeIndexCityQuery(location), cityIndexes);
    }

    public async searchBySkillAndLocation(skills: string[], location: string): Promise<void> {
        const skillMetaIndex = await this.getMetaIndex(SparqlQueryFactory.makeMetaMetaIndexSkillQuery());
        const cityMetaIndex = await this.getMetaIndex(SparqlQueryFactory.makeMetaMetaIndexCityQuery());
        const skillIndexes = await this.getIndex(SparqlQueryFactory.makeMetaIndexSkillQuery(skills), skillMetaIndex);
        const cityIndexes = await this.getIndex(SparqlQueryFactory.makeMetaIndexCityQuery(location), cityMetaIndex);
        const sources = skillIndexes.concat(cityIndexes);
        // console.log(SparqlQueryFactory.makeIndexSkillCityQuery(skills, location));
        this.getUsers(SparqlQueryFactory.makeIndexSkillCityQuery(skills, location), sources);
    }

    public searchFromSearchForm(searchForm: any = {}): void {
        // this.engine.invalidateHttpCache();

        const hasSkill = searchForm["skills"] && searchForm["skills"].value.length > 0;
        const hasCity = searchForm["profile.city"] && searchForm["profile.city"].value.length > 0;

        if (hasSkill && !hasCity) {
            const skills = searchForm["skills"].value.map(s => s["@id"]);
            this.searchBySkill(skills); //searchForm["skills"].value[0]["@id"]);
        }

        else if (hasCity && !hasSkill) {
            this.searchByLocation(searchForm["profile.city"].value);
        }

        else if (hasSkill && hasCity) {
            const skills = searchForm["skills"].value.map(s => s["@id"]);
            const city = searchForm["profile.city"].value;
            this.searchBySkillAndLocation(skills, city);
        }

        else this.searchByLocation("paris"); // default filter and reset
    }

}