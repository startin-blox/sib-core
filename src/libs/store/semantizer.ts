import type { Semantizer, Quad } from "@semantizer/types";
import dataFactory from "@rdfjs/data-model";
import { ConfigurationImpl, DatasetBaseFactoryImpl, MixinFactoryImpl, SemantizerImpl } from "@semantizer/core";
import { DatasetCoreRdfjsImpl } from "@semantizer/core-rdfjs";
import { DatasetMixin } from "@semantizer/mixin-dataset";
import IndexLoader from './index-loader.ts';
import { LoaderQuadStreamRdfjs } from "@semantizer/loader-quad-stream-rdfjs";

declare global {
    var SEMANTIZER: Semantizer;
}

const semantizer: Semantizer = new SemantizerImpl(
    new ConfigurationImpl({
        loader: new IndexLoader(),
        loaderQuadStream: new LoaderQuadStreamRdfjs(),
        datasetImpl: DatasetMixin(DatasetCoreRdfjsImpl),
        rdfModelDataFactory: dataFactory,
        mixinFactoryImpl: MixinFactoryImpl,
        datasetBaseFactoryImpl: DatasetBaseFactoryImpl
    })
);

Object.defineProperty(globalThis, "SEMANTIZER", {
    value: semantizer,
    writable: false, // can't be modified
    configurable: false, // can't be deleted
});