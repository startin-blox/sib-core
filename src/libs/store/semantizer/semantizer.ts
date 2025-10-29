import dataFactory from '@rdfjs/data-model';
import {
  ConfigurationImpl,
  DatasetBaseFactoryImpl,
  MixinFactoryImpl,
  SemantizerImpl,
} from '@semantizer/core';
import { DatasetCoreRdfjsImpl } from '@semantizer/core-rdfjs';
import { DatasetMixin } from '@semantizer/mixin-dataset';
import type { Semantizer } from '@semantizer/types';
import LoaderQuadStreamCore from './index-loader-quad.ts';
import IndexLoader from './index-loader.ts';

declare global {
  var SEMANTIZER: Semantizer;
}

const semantizer: Semantizer = new SemantizerImpl(
  new ConfigurationImpl({
    loader: new IndexLoader(),
    loaderQuadStream: new LoaderQuadStreamCore(),
    datasetImpl: DatasetMixin(DatasetCoreRdfjsImpl),
    rdfModelDataFactory: dataFactory,
    mixinFactoryImpl: MixinFactoryImpl,
    datasetBaseFactoryImpl: DatasetBaseFactoryImpl,
  }),
);

if (!globalThis.SEMANTIZER) {
  Object.defineProperty(globalThis, 'SEMANTIZER', {
    value: semantizer,
    writable: false, // can't be modified
    configurable: false, // can't be deleted
  });
}
