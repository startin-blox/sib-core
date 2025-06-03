import { Readable } from 'stream';
import datasetFactory from '@rdfjs/dataset';
import ParserJsonld from '@rdfjs/parser-jsonld';
// import N3 from "n3";
// import { HttpError } from "@semantizer/http-error";
// import { DatasetResponse, default as fetch, FactoryInit, FormatsInit, RdfFetchResponse } from "@rdfjs/fetch-lite";
import type { DatasetCoreRdfjs, Loader, Quad, Stream } from '@semantizer/types';
import { store } from './store.ts';

export default class IndexLoader implements Loader {
  public async load(uri: string): Promise<DatasetCoreRdfjs<Quad, Quad>> {
    let responseText, input;
    const headers = store.headers;
    const response = await store.fetchAuthn(uri, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    });

    if (!response && !response.ok) {
      throw new Error(response);
    }

    responseText = await response.text();
    input = new Readable({
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
