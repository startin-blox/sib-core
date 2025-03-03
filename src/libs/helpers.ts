import { ContextParser } from 'jsonld-context-parser';
import type { Resource } from '../mixins/interfaces.ts';

function uniqID(): string {
  return `_${(Math.random() * 36 ** 20).toString(36).slice(0, 10)}`;
}

function stringToDom(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
async function evalTemplateString(
  str: string,
  variables: { [key: string]: unknown } = {},
) {
  const keys = Object.keys(variables);
  const values = keys.map(key => variables[key]);
  try {
    const func = AsyncFunction.call(null, ...keys, `return \`${str}\``);
    return await func(...values);
  } catch (e) {
    console.log(e);
    throw new SyntaxError(`\`${str}\``);
  }
}

function importCSS(...stylesheets: string[]) {
  const linksElements: HTMLLinkElement[] = [];
  for (let url of stylesheets) {
    url = relativeSource(url);
    let link = Array.from(document.head.querySelectorAll('link')).find(
      link => link.href === url,
    );
    if (link) return link;
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    linksElements.push(link);
  }
  return linksElements;
}
/**
 * @param id an uniq id to avoid import a style twice
 * @param importer a callback returning this `import()` promise
 * @returns the style element
 *
 * typical use:
 * ```js
 * importInlineCSS('bootstrap', () => import('./css/bootstrap.css?inline'))
 * // adding '?inline' lets Vite convert css to js
 * ```
 */

function importInlineCSS(
  id: string,
  importer: string | (() => string | Promise<string | { default: string }>),
) {
  id = `sib-inline-css-${id}`;
  let style = document.head.querySelector<HTMLStyleElement>(`style#${id}`);
  if (style) return style;
  style = document.createElement('style');
  style.id = id;
  document.head.appendChild(style);
  (async () => {
    let textContent: string;
    if (typeof importer === 'string') textContent = importer;
    else {
      const imported = await importer();
      if (typeof imported === 'string') textContent = imported;
      else textContent = imported.default || '';
    }
    style.textContent = textContent;
  })();
  return style;
}

function importJS(...plugins: string[]): HTMLScriptElement[] {
  return plugins.map(url => {
    url = new URL(url, document.baseURI).href;
    let script = Array.from(document.querySelectorAll('script')).find(
      script => script.src === url,
    );
    if (script) return script;
    script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
    return script;
  });
}

function relativeSource(source: string) {
  if (!source.match(/^\..?\//)) return new URL(source, document.baseURI).href;
  const e = new Error();
  if (!e.stack) return source;
  const f2 = e.stack.split('\n').filter(l => l.includes(':'))[2];
  const line = f2.match(/[a-z]+:.*$/);
  if (!line) return source;
  const calledFile = line[0].replace(/(\:[0-9]+){2}\)?$/, '');
  source = new URL(source, calledFile).href;
  return source;
}

function loadScript(source: string) {
  source = relativeSource(source);
  return new Promise(resolve => {
    const script = document.createElement('script');
    const head = document.querySelector('head');
    script.async = true;
    script.onload = () => setTimeout(resolve, 0);
    script.src = source;
    if (head) head.appendChild(script);
  });
}

function domIsReady(): Promise<void> {
  return new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', () => resolve());
    }
  });
}

function setDeepProperty(
  obj: { [index: string]: any },
  path: string[],
  value: any,
) {
  const name = path.shift();
  if (name) {
    if (!(name in obj)) obj[name] = {};
    if (path.length > 0) setDeepProperty(obj[name], path, value);
    else obj[name] = value;
  }
}

function parseFieldsString(fields: string): string[] {
  if (!fields) return [];
  // remove all sets from fields
  while (fields.indexOf('(') > 0) {
    const firstBracket = fields.indexOf('(');
    const noset = fields.substring(
      firstBracket,
      findClosingBracketMatchIndex(fields, firstBracket) + 1,
    );
    fields = fields.replace(noset, '');
  }

  const re = /((^\s*|,)\s*)(("(\\"|[^"])*")|('(\\'|[^'])*')|[^,]*)/gm; // match , not inside quotes
  const fieldsArray = fields.match(re) || []; // separate fields
  if (!fieldsArray) return [];
  return fieldsArray.map(a => a.replace(/^[\s,]+/, '')); // remove commas and spaces
}

function findClosingBracketMatchIndex(str: string, pos: number) {
  if (str[pos] !== '(') throw new Error(`No '(' at index ${pos}`);
  let depth = 1;
  for (let i = pos + 1; i < str.length; i++) {
    switch (str[i]) {
      case '(':
        depth++;
        break;
      case ')':
        if (--depth === 0) return i;
        break;
    }
  }
  return -1;
}

function defineComponent(tagName: string, componentClass: typeof HTMLElement) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, componentClass);
  } else {
    console.warn(
      `Warning: the component "${tagName}" has already been loaded in another version of sib-core.`,
    );
  }
}

function fuzzyCompare(subject: string, search: string) {
  return compareTransform(subject).includes(compareTransform(String(search)));
}

function compareTransform(str: string) {
  return str
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll('œ', 'oe')
    .replaceAll('æ', 'ae')
    .replaceAll(/[ ,.!?;:-`"]+/g, ' ')
    .trim();
}

const compare: { [k: string]: (subject: any, query: any) => boolean } = {
  string(subject: string, query: string) {
    if (typeof subject !== 'string' || typeof query !== 'string')
      throw new TypeError('not a string');
    if (query === '') return true;
    return fuzzyCompare(subject, String(query));
  },
  boolean(subject: boolean, query: boolean) {
    if (!query) return true;
    return subject;
  },
  number(subject: number, query: number) {
    return subject === query;
  },
  list(subject: string, list: string[]) {
    return list.includes(subject);
  },
  range(subject: number | Date, range: [any, any]) {
    return (
      (range[0] == null || range[0] === '' || subject >= range[0]) &&
      (range[1] == null || range[1] === '' || subject <= range[1])
    );
  },
  resource(subject, query) {
    // dropdown default ' - ' option return an empty string
    if (query === '') return true;
    if (!query['@id']) return false;
    const ret = subject['@id'] === query['@id'];
    return ret;
  },
};

function generalComparator(
  a: unknown,
  b: unknown,
  order: 'asc' | 'desc' = 'asc',
): number {
  if (order === 'desc') return generalComparator(b, a);
  if (a == null && b == null) return 0;
  if (a === b || Object.is(a, b)) return 0;
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1;
  }
  if (!Number.isNaN(Number(a)) && !Number.isNaN(Number(b))) {
    return Number(a) - Number(b);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length - b.length;
  }
  const dateA = Date.parse(String(a));
  const dateB = Date.parse(String(b));
  if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) {
    return dateA - dateB;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return aKeys.length - bKeys.length;
  }
  if (a == null) return -1;
  if (b == null) return 1;
  return String(a).localeCompare(String(b));
}

function transformArrayToContainer(resource: object) {
  const newValue = { ...resource };
  for (const predicate of Object.keys(newValue)) {
    // iterate over all properties
    const predicateValue = newValue[predicate];
    if (!predicateValue || typeof predicateValue !== 'object') continue; // undefined or literal, do nothing
    if (['permissions', '@context'].includes(predicate)) continue; // do not transform permissions and context

    // if nested resource, transform its own nested resources to container recursively
    if (!Array.isArray(predicateValue) && predicateValue['@id']) {
      newValue[predicate] = transformArrayToContainer(resource[predicate]);
    }

    if (Array.isArray(predicateValue) && predicateValue['@id']) {
      // Do not systematically transform arrays to containers
      newValue[predicate] = {
        '@id': predicateValue['@id'],
        'ldp:contains': [...predicateValue], // ???? why only ldp:contains?
      };
      newValue[predicate]['ldp:contains'].forEach(
        (childPredicate: any, index: number) => {
          // but check all nested resources
          newValue[predicate]['ldp:contains'][index] =
            transformArrayToContainer(childPredicate);
        },
      );
    }
  }
  return newValue;
}

export function doesResourceContainPredicate(
  resource: object | string,
  context?: object,
): boolean {
  const predicates = [
    'ldp:contains',
    'dcat:dataset'
  ];

  const resolvedContext = context ?? {
    ...(resource as Resource).clientContext,
    ...(resource as Resource).serverContext,
  };

  const expandedPredicates = predicates.map(p =>
    ContextParser.expandTerm(p, resolvedContext, true),
  );
  return [...predicates, ...expandedPredicates].some(predicate =>
    typeof resource === 'object'
      ? predicate in resource
      : typeof resource === 'string' && resource.includes(predicate),
  );
}

export default class AsyncIterableBuilder<Type> {
  readonly #values: Promise<{ value: Type; done: boolean }>[] = [];
  #resolve!: (value: { value: Type; done: boolean }) => void;
  readonly iterable: AsyncIterable<Type>;
  readonly next: (value: Type, done?: boolean) => void;

  constructor() {
    this.#nextPromise();
    this.iterable = this.#createIterable();
    this.next = this.#next.bind(this);
  }

  async *#createIterable() {
    for (let index = 0; ; index++) {
      const { value, done } = await this.#values[index];
      delete this.#values[index];
      yield value;
      if (done) return;
    }
  }

  #next(value: Type, done = false) {
    this.#resolve({ value, done });
    this.#nextPromise();
  }

  #nextPromise() {
    this.#values.push(
      new Promise(resolve => {
        this.#resolve = resolve;
      }),
    );
  }
}

import type {
  AsyncQuerySelectorAllType,
  AsyncQuerySelectorType,
} from './async-query-selector-types.ts';

const asyncQuerySelector: AsyncQuerySelectorType = (
  selector: string,
  parent: ParentNode = document,
) =>
  new Promise<Element>(resolve => {
    const element = parent.querySelector(selector);
    if (element) return resolve(element);
    const observer = new MutationObserver(() => {
      const element = parent.querySelector(selector);
      if (!element) return;
      observer.disconnect();
      return resolve(element);
    });
    observer.observe(parent, {
      subtree: true,
      childList: true,
      attributes: true,
    });
  });

const asyncQuerySelectorAll: AsyncQuerySelectorAllType = (
  selector: string,
  parent: ParentNode = document,
) => {
  const delivered = new WeakSet<Element>();
  const { next, iterable } = new AsyncIterableBuilder<Element>();
  function checkNewElement() {
    for (const element of parent.querySelectorAll(selector)) {
      if (delivered.has(element)) continue;
      delivered.add(element);
      next(element);
    }
  }
  checkNewElement();
  const observer = new MutationObserver(checkNewElement);
  observer.observe(parent, {
    subtree: true,
    childList: true,
    attributes: true,
  });
  return iterable;
};

export {
  uniqID,
  stringToDom,
  evalTemplateString,
  importCSS,
  importInlineCSS,
  importJS,
  loadScript,
  domIsReady,
  setDeepProperty,
  parseFieldsString,
  findClosingBracketMatchIndex,
  defineComponent,
  fuzzyCompare,
  compare,
  generalComparator,
  transformArrayToContainer,
  AsyncIterableBuilder,
  asyncQuerySelector,
  asyncQuerySelectorAll,
};
