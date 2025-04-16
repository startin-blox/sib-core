// import N3 from "n3";
// import { HttpError } from "@semantizer/http-error";
// import { DatasetResponse, default as fetch, FactoryInit, FormatsInit, RdfFetchResponse } from "@rdfjs/fetch-lite";
import type { Quad, Stream, Loader, DatasetCoreRdfjs } from "@semantizer/types";
import { store } from './store.ts';
import ParserJsonld from '@rdfjs/parser-jsonld'
import { Readable } from "stream";
import datasetFactory from '@rdfjs/dataset'


export default class IndexLoader implements Loader{

    public async load(uri: string): Promise<DatasetCoreRdfjs<Quad, Quad>> {
        let responseBody;
        let responseText, input;
        let response = await store.fetchAuthn(uri, {
          method: 'GET',
          headers: store.headers,
          credentials: 'include',
        });
        // .then(response => {
        //   console.log("[IndexLoader] Index loaded", response);
        //   if (!response.ok) return;
        //   return response.json();
        // });

        if (!response) {
            throw new Error(response);
        } else {
          responseBody = response.body;
          responseText = await response.text();
          console.log("[IndexLoader] Index loaded", responseText);
          input = new Readable({
            read: () => {
              input.push(responseText)
              input.push(null)
            }
          });
        }
        // const quadStream = await this.loadQuadStream();
        // const semantizer = this.getSemantizer();
        // const datasets: DatasetSemantizer[] = []; // stores the datasets of the parsed entry, shape or property
        console.log("[IndexLoader] Input loaded", input);
        const parserJsonld = new ParserJsonld()
        const quads = parserJsonld.import(input);

        console.log("[LoaderQuadStreamRdfjs] Quads loaded", quads);
        

        // const quadSet = quads.quadStream();
        // console.log("[LoaderQuadStreamRdfjs] loaded", quadSet);
        let resDataset = datasetFactory.dataset();
        const quadsRes = new Promise<DatasetCoreRdfjs>((resolve,reject) => {  
          quads.on('data', (quad: Quad) => {
            console.log("[LoaderQuadStreamRdfjs] Dataset loaded", quad);
            resDataset.add(quad);
            if (quad === null) {
              console.log("[IndexLoader] Result Dataset loaded", resDataset);
              resolve(resDataset);
            }
          });
          quads.on('end', () => {
            // console.log("[LoaderQuadStreamRdfjs] Dataset loaded", quad);
            // resDataset.add(quad);
            resolve(resDataset);
          });
          quads.on('error', (error) => {
            console.error("[IndexLoader] Error loading quads", error);
            reject();
          });
        });

        return quadsRes;
        // return this._DatasetCoreRdfjsImpl(quads);
    }


}