// biome-ignore lint: Readable is coming from a polyfill
import { Readable } from 'stream';
import ParserJsonld from '@rdfjs/parser-jsonld';
import type { Fetch, LoaderQuadStream, LoggingComponent, Quad, Stream } from '@semantizer/types';
import { LoaderBase } from '@semantizer/util-loader-base';
import { StoreService } from '../storeService.ts';
const store = StoreService.getInstance();

export default class LoaderQuadStreamCore extends LoaderBase implements LoaderQuadStream {
  public getLoggingComponent(): LoggingComponent {
    return {
      type: 'PACKAGE',
      name: 'loader-quad-stream-core',
    };
  }

  public async load(uri: string, _otherFetch?: Fetch): Promise<Stream<Quad>> {
    const headers = store.headers;
    console.log(`Loading·specific·URI·${uri}`);
    const response = await store.fetchAuthn(uri, {
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
        input.push(responseText);
        input.push(null);
      },
    });
    const parserJsonld = new ParserJsonld();
    const quads = parserJsonld.import(input);

    return quads;
  }
}
