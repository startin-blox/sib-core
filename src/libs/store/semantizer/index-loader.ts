// biome-ignore lint: Readable is coming from a polyfill
import { Readable } from 'stream';
import datasetFactory from '@rdfjs/dataset';
import ParserJsonld from '@rdfjs/parser-jsonld';
import type {
  DatasetCoreRdfjs,
  Loader,
  LoggingComponent,
  Quad,
} from '@semantizer/types';
import { LoaderBase } from '@semantizer/util-loader-base';
import { StoreService } from '../storeService.ts';

export default class IndexLoader extends LoaderBase implements Loader {
  private customHeaders: Record<string, string> = {};

  override getLoggingComponent(): LoggingComponent {
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
    console.log('[IndexLoader] setCustomHeaders called:', headers);
    this.customHeaders = headers;
  }

  /**
   * Clear custom headers
   */
  public clearCustomHeaders(): void {
    console.log('[IndexLoader] clearCustomHeaders called');
    this.customHeaders = {};
  }

  public async load(uri: string): Promise<DatasetCoreRdfjs<Quad, Quad>> {
    // Get store instance lazily to avoid circular dependency issues
    const store = StoreService.getInstance();
    // Merge store headers with custom DSP headers
    const headers = { ...store.headers, ...this.customHeaders };
    console.log('[IndexLoader] Loading URI:', uri);
    console.log('[IndexLoader] Custom headers:', this.customHeaders);
    console.log('[IndexLoader] Final headers:', headers);
    const response = await store.fetchAuthn(uri, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    });

    // @ts-ignore
    if (!response && !response.ok) {
      throw new Error(response);
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
    const resDataset = datasetFactory.dataset();

    const quadsRes = new Promise<DatasetCoreRdfjs>((resolve, reject) => {
      quads.on('data', (quad: Quad) => {
        resDataset.add(quad);
        if (quad === null) {
          resolve(resDataset);
        }
      });
      quads.on('end', () => {
        resolve(resDataset);
      });
      quads.on('error', error => {
        console.error('[IndexLoader] Error loading quads', error);
        reject();
      });
    });

    return quadsRes;
  }
}
