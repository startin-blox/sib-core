import type { Fetch, LoaderQuadStream, Quad, Stream } from "@semantizer/types";
import { Readable } from 'stream';
import { store } from './store.ts';
import ParserJsonld from '@rdfjs/parser-jsonld';

export default class LoaderQuadStreamCore implements LoaderQuadStream {

    public async load(uri: string, otherFetch?: Fetch): Promise<Stream<Quad>> {
        let headers = store.headers;
        console.log("Loading specific URI " + uri);
        let response = await store.fetchAuthn(uri, {
          method: 'GET',
          headers: headers,
          credentials: 'include',
        });

        if (!response.ok) {
            throw new Error();
        }

        const responseText = await response.text();
        const input = new Readable({
            read: () => {
                input.push(responseText)
                input.push(null)
            }
        });
        const parserJsonld = new ParserJsonld()
        const quads = parserJsonld.import(input);

        return quads;

    }

}