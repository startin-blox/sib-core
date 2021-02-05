/**
 * Spread function from open-wc/lit-helpers
 * More informations here: https://open-wc.org/developing/lit-helpers.html
 */
import {html, TemplateResult, directive, noChange } from 'lit-html';

const prevCache = new WeakMap();
export const spread = directive((spreadData) => (part) => {
  const prevData = prevCache.get(part);
  if (prevData === spreadData) {
    return;
  }
  prevCache.set(part, spreadData);

  if (spreadData) {
    for (const key in spreadData) {
      const value = spreadData[key];
      if (value === noChange) continue;

      const prefix = key[0];
      const { element } = part.committer;

      if (prefix === '@') {
        const prevHandler = prevData && prevData[key];
        if (!prevHandler || prevHandler !== value) {
          const name = key.slice(1);
          if (prevHandler) element.removeEventListener(name, prevHandler);
          element.addEventListener(name, value);
        }
        continue;
      }
      if (prefix === '.') {
        if (!prevData || prevData[key] !== value) {
          element[key.slice(1)] = value;
        }
        continue;
      }
      if (prefix === '?') {
        if (!prevData || prevData[key] !== value) {
          const name = key.slice(1);
          if (value) {
            element.setAttribute(name, '');
          } else {
            element.removeAttribute(name);
          }
        }
        continue;
      }
      if (!prevData || prevData[key] !== value) {
        if (value != null) {
          element.setAttribute(key, String(value));
        } else {
          element.removeAttribute(key);
        }
      }
    }
  }

  if (prevData) {
    for (const key in prevData) {
      if (!spreadData || !(key in spreadData)) {
        const prefix = key[0];
        const { element } = part.committer;

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
});


interface CachedNeedlessValue {
    value: any;
    index: number;
}

interface CachedTemplateStrings {
    strings: string[];
    needlessValues: CachedNeedlessValue[];
}

function dropIndices(arr: any[], needlessValues: CachedNeedlessValue[]): any[] {
    const newArr: any[] = [];
    let j = 0;

    for (let i = 0, n = arr.length; i < n; ++i) {
        if (needlessValues[j].index === i) {
            ++j;
        } else {
            newArr.push(arr[i]);
        }
    }

    return newArr;
}

const templateStringsCache = new WeakMap<TemplateStringsArray, CachedTemplateStrings[]>();

// Convert dynamic tags to template strings
// example: <${'div'}>${'this is example'}</${'div'}> => <div>${'this is example'}</div>
export function preHTML(strings: TemplateStringsArray, ...values: any[]): TemplateResult {
    // check cache !important return equal link at first argument
    let cachedStrings = templateStringsCache.get(strings) as CachedTemplateStrings[];
    if (cachedStrings) {
        for (let i = 0, n = cachedStrings.length; i < n; ++i) {
            const needlessValues = cachedStrings[i].needlessValues;
            let isSame = true;
            for (let ii = 0, nn = needlessValues.length; ii < nn; ++ii) {
                if (values[needlessValues[ii].index] !== needlessValues[ii].value) {
                    isSame = false;
                    break;
                }
            }

            if (isSame) {
                return html(
                    cachedStrings[i].strings as any,
                    ...dropIndices(values, needlessValues)
                );
            }
        }
    }

    const needlessValues: CachedNeedlessValue[] = [];
    const newStrings: string[] = [];

    let str: string;
    for (let i = 0, n = strings.length; i < n; ++i) {
        str = strings[i];

        while (
            str[str.length - 1] === '<' // open tag
            || (str[str.length - 2] === '<' && str[str.length - 1] === '/') // close tag
        ) {
            needlessValues.push({
                value: values[i],
                index: i,
            });
            str += values[i] + strings[++i];
        }

        newStrings.push(str);
    }

    if (!cachedStrings) {
        cachedStrings = [];
        templateStringsCache.set(strings, cachedStrings);
    }

    cachedStrings.push({
        strings: newStrings,
        needlessValues,
    });

    return html(newStrings as any, ...dropIndices(values, needlessValues));
}