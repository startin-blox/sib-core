/**
 * Spread function from open-wc/lit-helpers
 * More informations here: https://open-wc.org/developing/lit-helpers.html
 */

import {
  type AttributePart,
  type BooleanAttributePart,
  type ChildPart,
  type ElementPart,
  type EventPart,
  type PropertyPart,
  type TemplateResult,
  html,
  noChange,
} from 'lit';

import {
  type PartInfo,
  directive,
  Directive,
  PartType,
} from 'lit/directive.js';

type SpreadPartType =
  | ChildPart
  | AttributePart
  | BooleanAttributePart
  | EventPart
  | PropertyPart
  | ElementPart;

const prevCache = new WeakMap();

class SpreadDirective extends Directive {
  spreadData: any;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    this.spreadData = null;
  }

  render(spreadData: any) {
    this.spreadData = spreadData;
    return noChange;
  }

  override update(part: SpreadPartType, [spreadData]: any) {
    const prevData = prevCache.get(part);

    if (prevData === spreadData) {
      return noChange;
    }

    let element: HTMLElement;
    prevCache.set(part, spreadData);

    if (part.type === PartType.ATTRIBUTE || part.type === PartType.PROPERTY) {
      element = part.element;
    } else {
      console.warn(
        'Unsupported part type or missing element, skipping update.',
      );
      return noChange;
    }

    if (spreadData) {
      for (const key in spreadData) {
        const value = spreadData[key];
        if (value === noChange) continue;

        const prefix = key[0];

        // Handle event listeners (e.g., @click)
        if (prefix === '@') {
          const prevHandler = prevData?.[key];
          if (!prevHandler || prevHandler !== value) {
            const name = key.slice(1); // Extract event name
            if (prevHandler) element.removeEventListener(name, prevHandler);
            element.addEventListener(name, value);
          }
          continue;
        }

        // Handle properties (e.g., .value)
        if (prefix === '.') {
          if (!prevData || prevData[key] !== value) {
            element[key.slice(1)] = value;
          }
          continue;
        }

        // Handle boolean attributes (e.g., ?disabled)
        if (prefix === '?') {
          const attrName = key.slice(1); // Extract attribute name
          if (!prevData || prevData[key] !== value) {
            if (value) {
              element.setAttribute(attrName, '');
            } else {
              element.removeAttribute(attrName);
            }
          }
          continue;
        }

        // Handle regular attributes (e.g., class, id)
        if (!prevData || prevData[key] !== value) {
          if (value != null) {
            element.setAttribute(key, String(value));
          } else {
            element.removeAttribute(key);
          }
        }
      }
    }

    // Remove any old attributes or event listeners no longer in spreadData
    if (prevData) {
      for (const key in prevData) {
        if (!spreadData || !(key in spreadData)) {
          const prefix = key[0];

          if (prefix === '@') {
            element.removeEventListener(key.slice(1), prevData[key]);
            continue;
          }
          if (prefix === '.') {
            element[key.slice(1)] = undefined;
            continue;
          }
          if (prefix === '?') {
            element.removeAttribute(key.slice(1));
            continue;
          }
          element.removeAttribute(key);
        }
      }
    }

    return noChange;
  }
}

export const spread = directive(SpreadDirective);

interface CachedNeedlessValue {
  value: any;
  index: number;
}

interface CachedTemplateStrings {
  strings: TemplateStringsArray;
  needlessValues: CachedNeedlessValue[];
}

const templateStringsCache = new WeakMap<
  TemplateStringsArray,
  CachedTemplateStrings[]
>();

function filterOutNeedlessValues(
  arr: any[],
  needlessValues: CachedNeedlessValue[],
): any[] {
  return arr.filter((_, i) => !needlessValues.some(nv => nv.index === i));
}

export function preHTML(
  strings: TemplateStringsArray,
  ...values: any[]
): TemplateResult {
  let cachedStrings = templateStringsCache.get(strings);

  if (cachedStrings) {
    for (const cached of cachedStrings) {
      const { needlessValues } = cached;
      const isSame = needlessValues.every(nv => values[nv.index] === nv.value);

      if (isSame) {
        // Return cached template result if values match
        return html(
          cached.strings,
          ...filterOutNeedlessValues(values, needlessValues),
        );
      }
    }
  }

  // No match found, so we need to create new template strings and cache them
  const needlessValues: CachedNeedlessValue[] = [];
  const newStrings: string[] = [];

  for (let i = 0; i < strings.length; i++) {
    let str = strings[i];

    while (str.endsWith('<') || (str.length >= 2 && str.endsWith('</'))) {
      needlessValues.push({ value: values[i], index: i });
      str += values[i] + strings[++i];
    }

    newStrings.push(str);
  }

  // Convert newStrings back to TemplateStringsArray type
  const finalStrings = Object.assign([...newStrings], { raw: strings.raw });

  if (!cachedStrings) {
    cachedStrings = [];
    templateStringsCache.set(strings, cachedStrings);
  }

  cachedStrings.push({
    strings: finalStrings as TemplateStringsArray,
    needlessValues,
  });

  return html(
    finalStrings as TemplateStringsArray,
    ...filterOutNeedlessValues(values, needlessValues),
  );
}
