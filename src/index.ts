import './libs/polyfills.js';
import { SolidAcChecker } from './components/solid-ac-checker';
import { SolidDelete } from './components/solid-delete';
// Components
import { SolidDisplay } from './components/solid-display';
import { SolidForm } from './components/solid-form';
import { SolidFormSearch } from './components/solid-form-search';
import { SolidLang } from './components/solid-lang';
import { SolidMemberAdd } from './components/solid-member-add';
import { SolidMemberDelete } from './components/solid-member-delete';
import { SolidMembership } from './components/solid-membership';
import { SolidTable } from './components/solid-table';
import { SolidWidget } from './components/solid-widget';

// Mixins
import { CounterMixin } from './mixins/counterMixin';
import { FederationMixin } from './mixins/federationMixin';
import { FilterMixin } from './mixins/filterMixin';
import { GrouperMixin } from './mixins/grouperMixin';
import { HighlighterMixin } from './mixins/highlighterMixin';
import { ListMixin } from './mixins/listMixin';
import { NextMixin } from './mixins/nextMixin';
import { PaginateMixin } from './mixins/paginateMixin';
import { RequiredMixin } from './mixins/requiredMixin';
import { SorterMixin } from './mixins/sorterMixin';
import { StoreMixin } from './mixins/storeMixin';
import { TranslationMixin } from './mixins/translationMixin';
import { ValidationMixin } from './mixins/validationMixin';
import { WidgetMixin } from './mixins/widgetMixin';

import * as AttributeMixins from './new-widgets/attributeMixins';
import { BaseWidgetMixin } from './new-widgets/baseWidgetMixin';
import * as CallbackMixins from './new-widgets/callbackMixins';
// New widgets system
import { newWidgetFactory } from './new-widgets/new-widget-factory';
import * as TemplateAdditionMixins from './new-widgets/templateAdditionMixins';
import * as Templates from './new-widgets/templates';
import * as TemplatesDependenciesMixins from './new-widgets/templatesDependencies';

import { Sib } from './libs/Sib';
import * as Helpers from './libs/helpers';
// Libs
import { base_context as baseContext, store } from './libs/store/store';
import SolidTemplateElement from './solid-template-element';
import { widgetFactory } from './widgets/widget-factory';

// lit-html
import { html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { until } from 'lit/directives/until.js';

export {
  // Components
  SolidDisplay,
  SolidForm,
  SolidFormSearch,
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
