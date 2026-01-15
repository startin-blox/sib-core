// biome-ignore lint: Readable is coming from a polyfill
import { Readable } from 'stream';
import ParserJsonld from '@rdfjs/parser-jsonld';
import type {
  Fetch,
  LoaderQuadStream,
  LoggingComponent,
  Quad,
  Stream,
} from '@semantizer/types';
import { LoaderBase } from '@semantizer/util-loader-base';
import { StoreService } from '../storeService.ts';

export default class LoaderQuadStreamCore
  extends LoaderBase
  implements LoaderQuadStream
{
  private customHeaders: Record<string, string> = {};

  public getLoggingComponent(): LoggingComponent {
    return {
      type: 'PACKAGE',
      name: 'loader-quad-stream-core',
    };
  }

  /**
   * Set custom headers for DSP-protected index loading
   * These headers will be merged with default store headers
   */
  public setCustomHeaders(headers: Record<string, string>): void {
    console.log('[LoaderQuadStreamCore] setCustomHeaders called:', headers);
    this.customHeaders = headers;
  }

  /**
   * Clear custom headers
   */
  public clearCustomHeaders(): void {
    console.log('[LoaderQuadStreamCore] clearCustomHeaders called');
    this.customHeaders = {};
  }

  public async load(uri: string, _otherFetch?: Fetch): Promise<Stream<Quad>> {
    // Get store instance lazily to avoid circular dependency issues
    const store = StoreService.getInstance();
    // Merge store headers with custom DSP headers
    const headers = { ...store.headers, ...this.customHeaders };
    console.log('[LoaderQuadStreamCore] Loading URI:', uri);
    console.log('[LoaderQuadStreamCore] Custom headers:', this.customHeaders);
    console.log('[LoaderQuadStreamCore] Final headers:', headers);
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
