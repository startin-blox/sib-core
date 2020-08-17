/**
 * Spread function from open-wc/lit-helpers
 * More informations here: https://open-wc.org/developing/lit-helpers.html
 */
//@ts-ignore
import { directive, noChange } from 'https://unpkg.com/lit-html?module';
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