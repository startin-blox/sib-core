import { QueryEngine } from '@comunica/query-sparql';
import { SparqlQueryFactory } from '../libs/SparqlQueryFactory.ts';

export type SparqlQueryEngineComunicaUpdateCallback = (
  user: string,
) => Promise<void>;
export type SparqlQueryEngineComunicaResetCallback = () => void;

export class SparqlQueryEngineComunica {
  private engine: any; //QueryEngine;
  private metaMetaIndex: string;
  private updateCallback: SparqlQueryEngineComunicaUpdateCallback;
  private resetCallback: SparqlQueryEngineComunicaResetCallback;

  public constructor(
    _metaMetaIndex: string,
    updateCallback: SparqlQueryEngineComunicaUpdateCallback,
    resetCallback: SparqlQueryEngineComunicaResetCallback,
  ) {
    this.engine = new QueryEngine();
    this.metaMetaIndex =
      'https://api.test-inria-index.startinblox.com/fedex/indexes/users/index'; //metaMetaIndex;
    this.updateCallback = updateCallback;
    this.resetCallback = resetCallback;
  }

  private makeBindingsStreamPromise(bindingsStream: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      bindingsStream.on('end', () => resolve());
      bindingsStream.on('error', () => reject());
    });
  }

  private async makeBindingsStream(
    query: string,
    sources: string[],
  ): Promise<any> {
    return await this.engine.queryBindings(query, {
      lenient: true, // ignore HTTP fails
      sources: sources,
    });
  }

  private async getSingleResultFromBindingsStream(
    bindingsStream: any,
  ): Promise<string> {
    let result = '';
    bindingsStream.on('data', (binding: any) => {
      result = binding.get('result').value;
      return result;
    });
    await this.makeBindingsStreamPromise(bindingsStream);
    return result;
  }

  private async getMultipleResultFromBindingsStream(
    bindingsStream: any,
  ): Promise<string[]> {
    return (await bindingsStream.toArray()).map(b => b.get('result').value);
  }

  private async getResultsFromBindingsStream(
    bindingsStream: any,
  ): Promise<void> {
    let count = 0;
    bindingsStream.on('data', async (binding: any) => {
      count++;
      await this.updateCallback(binding.get('result').value);
    });
    await this.makeBindingsStreamPromise(bindingsStream);
    console.log(count);
    if (count === 0) {
      this.resetCallback();
    }
  }

  private async getMetaIndex(query: string): Promise<string> {
    const bindingsStream = await this.makeBindingsStream(query, [
      this.metaMetaIndex,
    ]);
    return await this.getSingleResultFromBindingsStream(bindingsStream);
  }

  private async getIndex(
    query: string,
    ...metaIndex: string[]
  ): Promise<string[]> {
    const bindingsStream = await this.makeBindingsStream(query, [...metaIndex]);
    return this.getMultipleResultFromBindingsStream(bindingsStream);
  }

  private async getIndexResultsAsStream(
    query: string,
    callback: Function,
    metaIndex: string[],
  ): Promise<void> {
    const bindingsStream = await this.makeBindingsStream(query, metaIndex);
    console.log('Query launched', query);
    bindingsStream.on('data', (binding: any) =>
      callback(binding.get('result').value),
    );
    return this.makeBindingsStreamPromise(bindingsStream);
  }

  private async getUsers(query: string, indexes: string[]): Promise<void> {
    const bindingsStream = await this.makeBindingsStream(query, indexes);
    return await this.getResultsFromBindingsStream(bindingsStream);
  }

  public async searchBySkill(skills: string[]): Promise<void> {
    const skillMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexSkillQuery(),
    );
    const skillIndexes = await this.getIndex(
      SparqlQueryFactory.makeMetaIndexSkillQuery(skills),
      skillMetaIndex,
    );
    this.getUsers(SparqlQueryFactory.makeIndexSkillQuery(skills), skillIndexes);
  }

  public async searchByLocation(location: string): Promise<void> {
    const cityMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexCityQuery(),
    );
    const cityIndexes = await this.getIndex(
      SparqlQueryFactory.makeMetaIndexCityQuery(location),
      cityMetaIndex,
    );
    this.getUsers(SparqlQueryFactory.makeIndexCityQuery(location), cityIndexes);
  }

  private extractPatterns(input: string): string[] {
    return input.split(' ').map(n => n.toLowerCase().substring(0, 3)); // split the name and take the first 3 chars.
  }

  public async searchByName(name: string): Promise<void> {
    const patterns = this.extractPatterns(name);
    const firstNameMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexFirstNameQuery(),
    );
    const callback = (nameMetaIndex: string) => {
      this.getUsers(SparqlQueryFactory.makeIndexNameQuery(patterns), [
        nameMetaIndex,
      ]);
    };
    const query = SparqlQueryFactory.makeMetaIndexNameQuery(patterns);
    await this.getIndexResultsAsStream(query, callback, [firstNameMetaIndex]);
    const lastNameMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexLastNameQuery(),
    );
    await this.getIndexResultsAsStream(query, callback, [lastNameMetaIndex]);
  }

  public async searchBySkillAndLocation(
    skills: string[],
    location: string,
  ): Promise<void> {
    const skillMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexSkillQuery(),
    );
    const cityMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexCityQuery(),
    );
    const skillIndexes = await this.getIndex(
      SparqlQueryFactory.makeMetaIndexSkillQuery(skills),
      skillMetaIndex,
    );
    const cityIndexes = await this.getIndex(
      SparqlQueryFactory.makeMetaIndexCityQuery(location),
      cityMetaIndex,
    );
    const sources = skillIndexes.concat(cityIndexes);
    this.getUsers(
      SparqlQueryFactory.makeIndexSkillCityQuery(skills, location),
      sources,
    );
  }

  public async searchBySkillAndName(
    skills: string[],
    name: string,
  ): Promise<void> {
    const patterns = this.extractPatterns(name);
    const skillMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexSkillQuery(),
    );
    const skillIndexes = await this.getIndex(
      SparqlQueryFactory.makeMetaIndexSkillQuery(skills),
      skillMetaIndex,
    );
    const firstNameMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexFirstNameQuery(),
    );
    const callback = (nameMetaIndex: string) => {
      const userQuery = SparqlQueryFactory.makeIndexSkillFirstNameQuery(
        skills,
        patterns,
      );
      const sources = [nameMetaIndex, ...skillIndexes];
      console.log(userQuery, sources);
      this.getUsers(userQuery, sources);
    };
    const query = SparqlQueryFactory.makeMetaIndexNameQuery(patterns);
    await this.getIndexResultsAsStream(query, callback, [firstNameMetaIndex]);
    const lastNameMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexLastNameQuery(),
    );
    const callbackLastName = (nameMetaIndex: string) => {
      const userQuery = SparqlQueryFactory.makeIndexSkillLastNameQuery(
        skills,
        patterns,
      );
      const sources = [nameMetaIndex, ...skillIndexes];
      console.log(userQuery, sources);
      this.getUsers(userQuery, sources);
    };
    await this.getIndexResultsAsStream(query, callbackLastName, [
      lastNameMetaIndex,
    ]);
  }

  public async searchByLocationAndName(
    location: string,
    name: string,
  ): Promise<void> {
    const patterns = this.extractPatterns(name);
    const cityMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexCityQuery(),
    );
    const cityIndexes = await this.getIndex(
      SparqlQueryFactory.makeMetaIndexCityQuery(location),
      cityMetaIndex,
    );
    const firstNameMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexFirstNameQuery(),
    );
    const callback = (nameMetaIndex: string) => {
      const userQuery = SparqlQueryFactory.makeIndexCityFirstNameQuery(
        location,
        patterns,
      );
      const sources = [nameMetaIndex, ...cityIndexes];
      console.log(userQuery, sources);
      this.getUsers(userQuery, sources);
    };
    const query = SparqlQueryFactory.makeMetaIndexNameQuery(patterns);
    await this.getIndexResultsAsStream(query, callback, [firstNameMetaIndex]);
    const lastNameMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexLastNameQuery(),
    );
    const callbackLastName = (nameMetaIndex: string) => {
      const userQuery = SparqlQueryFactory.makeIndexCityLastNameQuery(
        location,
        patterns,
      );
      const sources = [nameMetaIndex, ...cityIndexes];
      console.log(userQuery, sources);
      this.getUsers(userQuery, sources);
    };
    await this.getIndexResultsAsStream(query, callbackLastName, [
      lastNameMetaIndex,
    ]);
  }

  public async searchBySkillAndLocationAndName(
    skills: string[],
    location: string,
    name: string,
  ): Promise<void> {
    const patterns = this.extractPatterns(name);
    const skillMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexSkillQuery(),
    );
    const cityMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexCityQuery(),
    );
    const skillIndexes = await this.getIndex(
      SparqlQueryFactory.makeMetaIndexSkillQuery(skills),
      skillMetaIndex,
    );
    const cityIndexes = await this.getIndex(
      SparqlQueryFactory.makeMetaIndexCityQuery(location),
      cityMetaIndex,
    );
    const firstNameMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexFirstNameQuery(),
    );
    const callback = (nameMetaIndex: string) => {
      const userQuery = SparqlQueryFactory.makeIndexSkillAndCityFirstNameQuery(
        skills,
        location,
        patterns,
      );
      const sources = [nameMetaIndex, ...skillIndexes, ...cityIndexes];
      console.log(userQuery, sources);
      this.getUsers(userQuery, sources);
    };
    const query = SparqlQueryFactory.makeMetaIndexNameQuery(patterns);
    await this.getIndexResultsAsStream(query, callback, [firstNameMetaIndex]);
    const lastNameMetaIndex = await this.getMetaIndex(
      SparqlQueryFactory.makeMetaMetaIndexLastNameQuery(),
    );
    const callbackLastName = (nameMetaIndex: string) => {
      const userQuery = SparqlQueryFactory.makeIndexSkillAndCityLastNameQuery(
        skills,
        location,
        patterns,
      );
      const sources = [nameMetaIndex, ...skillIndexes, ...cityIndexes];
      console.log(userQuery, sources);
      this.getUsers(userQuery, sources);
    };
    await this.getIndexResultsAsStream(query, callbackLastName, [
      lastNameMetaIndex,
    ]);
  }

  public searchFromSearchForm(searchForm: any = {}): void {
    this.engine.invalidateHttpCache();

    const hasSkill: boolean =
      searchForm.skills && searchForm.skills.value.length > 0;
    const hasCity: boolean =
      searchForm['profile.city'] && searchForm['profile.city'].value.length > 0;
    const hasName: boolean =
      searchForm.name && searchForm.name.value.length > 0;

    // search by skill
    if (hasSkill && !hasCity && !hasName) {
      const skills = searchForm.skills.value.map(s => s['@id']);
      this.searchBySkill(skills);
    }

    // search by location
    else if (hasCity && !hasSkill && !hasName) {
      this.searchByLocation(searchForm['profile.city'].value);
    }

    // search by name
    else if (hasName && !hasSkill && !hasCity) {
      this.searchByName(searchForm.name.value);
    }

    // search by skill and location
    else if (hasSkill && hasCity && !hasName) {
      const skills = searchForm.skills.value.map(s => s['@id']);
      const city = searchForm['profile.city'].value;
      this.searchBySkillAndLocation(skills, city);
    }

    // search by skill and name
    else if (hasSkill && hasName && !hasCity) {
      const skills = searchForm.skills.value.map(s => s['@id']);
      const name = searchForm.name.value;
      this.searchBySkillAndName(skills, name);
    }

    // search by city and name
    else if (hasCity && hasName && !hasSkill) {
      const location = searchForm['profile.city'].value;
      const name = searchForm.name.value;
      this.searchByLocationAndName(location, name);
    }

    // search by skill, city and name
    else if (hasSkill && hasName && hasCity) {
      const skills = searchForm.skills.value.map(s => s['@id']);
      const location = searchForm['profile.city'].value;
      const name = searchForm.name.value;
      this.searchBySkillAndLocationAndName(skills, location, name);
    }
  }
}
