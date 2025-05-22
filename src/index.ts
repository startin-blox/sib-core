import './libs/polyfills.js';
import { SolidAcChecker } from './components/solid-ac-checker.ts';
import { SolidDelete } from './components/solid-delete.ts';
// Components
import { SolidDisplay } from './components/solid-display.ts';
import { SolidFormSearch } from './components/solid-form-search.ts';
import { SolidForm } from './components/solid-form.ts';
import { SolidLang } from './components/solid-lang.ts';
import { SolidMemberAdd } from './components/solid-member-add.ts';
import { SolidMemberDelete } from './components/solid-member-delete.ts';
import { SolidMembership } from './components/solid-membership.ts';
import { SolidTable } from './components/solid-table.ts';
import { SolidTraversalSearch } from './components/solid-traversal-search.ts';
import { SolidWidget } from './components/solid-widget.ts';

// Mixins
import { CounterMixin } from './mixins/counterMixin.ts';
import { FederationMixin } from './mixins/federationMixin.ts';
import { FilterMixin } from './mixins/filterMixin.ts';
import { GrouperMixin } from './mixins/grouperMixin.ts';
import { HighlighterMixin } from './mixins/highlighterMixin.ts';
import { ListMixin } from './mixins/listMixin.ts';
import { NextMixin } from './mixins/nextMixin.ts';
import { PaginateMixin } from './mixins/paginateMixin.ts';
import { RequiredMixin } from './mixins/requiredMixin.ts';
import { SorterMixin } from './mixins/sorterMixin.ts';
import { StoreMixin } from './mixins/storeMixin.ts';
import { TranslationMixin } from './mixins/translationMixin.ts';
import { ValidationMixin } from './mixins/validationMixin.ts';
import { WidgetMixin } from './mixins/widgetMixin.ts';

import * as AttributeMixins from './new-widgets/attributeMixins/index.ts';
import { BaseWidgetMixin } from './new-widgets/baseWidgetMixin.ts';
import * as CallbackMixins from './new-widgets/callbackMixins/index.ts';
// New widgets system
import { newWidgetFactory } from './new-widgets/new-widget-factory.ts';
import * as TemplateAdditionMixins from './new-widgets/templateAdditionMixins/index.ts';
import * as Templates from './new-widgets/templates/index.ts';
import * as TemplatesDependenciesMixins from './new-widgets/templatesDependencies/index.ts';

import { Sib } from './libs/Sib.ts';
import * as Helpers from './libs/helpers.ts';
// Libs
import SolidTemplateElement from './solid-template-element.ts';
import { baseContext, store } from './store.ts';
import { widgetFactory } from './widgets/widget-factory.ts';

// lit-html
import { html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { until } from 'lit/directives/until.js';
import process from 'process';

// Define `process` globally if it doesn't exist
if (typeof globalThis.process === 'undefined') {
  globalThis.process = process;
}

export {
  // Components
  SolidDisplay,
  SolidForm,
  SolidFormSearch,
  SolidTraversalSearch,
  SolidWidget,
  SolidAcChecker,
  SolidDelete,
  SolidLang,
  SolidTable,
  SolidMembership,
  SolidMemberDelete,
  SolidMemberAdd,
  // Mixins
  CounterMixin,
  FederationMixin,
  FilterMixin,
  GrouperMixin,
  HighlighterMixin,
  ListMixin,
  NextMixin,
  PaginateMixin,
  RequiredMixin,
  SorterMixin,
  StoreMixin,
  TranslationMixin,
  ValidationMixin,
  WidgetMixin,
  // New widgets system
  AttributeMixins,
  CallbackMixins,
  TemplateAdditionMixins,
  TemplatesDependenciesMixins,
  Templates,
  // Libs
  store,
  Sib,
  SolidTemplateElement,
  widgetFactory,
  newWidgetFactory,
  BaseWidgetMixin,
  Helpers,
  baseContext,
  // lit-html
  html,
  render,
  ifDefined,
  until,
  unsafeHTML,
};
