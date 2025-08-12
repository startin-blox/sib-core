// biome-ignore lint: Readable is coming from a polyfill
import { Readable } from 'stream';
import datasetFactory from '@rdfjs/dataset';
import ParserJsonld from '@rdfjs/parser-jsonld';
import type { DatasetCoreRdfjs, Loader, LoggingComponent, Quad } from '@semantizer/types';
import { LoaderBase } from "@semantizer/util-loader-base";
import { StoreService } from '../storeService.ts';
const store = StoreService.getInstance();

export default class IndexLoader extends LoaderBase implements Loader {
  override getLoggingComponent(): LoggingComponent {
    return {
      type: 'PACKAGE',
      name: 'loader-quad-stream-core',
    };
  }

  public async load(uri: string): Promise<DatasetCoreRdfjs<Quad, Quad>> {
    const headers = store.headers;
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

    console.log('[IndexLoader] Input loaded', input);
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
