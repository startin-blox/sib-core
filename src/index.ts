import './libs/polyfills.js';
// Components
import { SolidDisplay } from './components/solid-display';
import { SolidForm } from './components/solid-form';
import { SolidFormSearch } from './components/solid-form-search';
import { SolidWidget } from './components/solid-widget';
import { SolidAcChecker } from './components/solid-ac-checker';
import { SolidDelete } from './components/solid-delete';
import { SolidLang } from './components/solid-lang';
import { SolidTable } from './components/solid-table';
import { SolidMap } from './components/solid-map';
import { SolidMembership } from './components/solid-membership';
import { SolidMemberDelete } from './components/solid-member-delete';
import { SolidMemberAdd } from './components/solid-member-add';

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

// New widgets system
import { newWidgetFactory } from './new-widgets/new-widget-factory';
import { BaseWidgetMixin } from './new-widgets/baseWidgetMixin';
import * as AttributeMixins from './new-widgets/attributeMixins';
import * as CallbackMixins from './new-widgets/callbackMixins';
import * as TemplateAdditionMixins from './new-widgets/templateAdditionMixins';
import * as Templates from './new-widgets/templates';
import * as TemplatesDependenciesMixins from './new-widgets/templatesDependencies';

// Libs
import { store, base_context as baseContext } from './libs/store/store';
import { Sib } from './libs/Sib';
import SolidTemplateElement from './solid-template-element';
import { widgetFactory } from './widgets/widget-factory';
import * as Helpers from './libs/helpers';

// lit-html
import { html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { until } from 'lit/directives/until.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

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
  SolidMap,
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
