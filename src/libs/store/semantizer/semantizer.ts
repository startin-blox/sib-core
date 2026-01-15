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
  var SEMANTIZER_INDEX_LOADER: IndexLoader;
  var SEMANTIZER_QUAD_STREAM_LOADER: LoaderQuadStreamCore;
}

// Create shared loader instances that can be configured with custom headers
const indexLoader = new IndexLoader();
const loaderQuadStream = new LoaderQuadStreamCore();

const semantizer: Semantizer = new SemantizerImpl(
  new ConfigurationImpl({
    loader: indexLoader,
    loaderQuadStream: loaderQuadStream,
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
    configurable: true, // can't be deleted
  });
}

// Export the index loader globally so DSP headers can be set for protected index access
if (!globalThis.SEMANTIZER_INDEX_LOADER) {
  Object.defineProperty(globalThis, 'SEMANTIZER_INDEX_LOADER', {
    value: indexLoader,
    writable: false,
    configurable: true,
  });
}

// Export the quad stream loader globally so DSP headers can be set for protected sub-index access
if (!globalThis.SEMANTIZER_QUAD_STREAM_LOADER) {
  Object.defineProperty(globalThis, 'SEMANTIZER_QUAD_STREAM_LOADER', {
    value: loaderQuadStream,
    writable: false,
    configurable: true,
  });
}
