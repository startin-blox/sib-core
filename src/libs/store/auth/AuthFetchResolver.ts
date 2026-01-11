export const DEFAULT_AUTH_SELECTORS = ['sib-auth-oidc', 'sib-auth'] as const;

/**
 * Finds first auth element in DOM with getFetch() method
 * @param selectors - CSS selectors to check
 * @returns Auth element or null
 */
export function findAuthElement(
  selectors: string[] = [...DEFAULT_AUTH_SELECTORS],
): Element | null {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && typeof (element as any).getFetch === 'function') {
      return element;
    }
  }
  return null;
}

/**
 * Gets authenticated fetch function from auth component, or standard fetch as fallback
 * @param selectors - Optional custom CSS selectors
 * @returns Authenticated fetch function or regular fetch
 */
export function getAuthFetch(
  selectors?: string[],
): (input: RequestInfo, init?: RequestInit) => Promise<Response> {
  const authElement = findAuthElement(selectors);

  if (authElement) {
    try {
      const authFetch = (authElement as any).getFetch();
      if (typeof authFetch === 'function') {
        return authFetch;
      }
    } catch (error) {
      console.warn('[AuthFetchResolver] Error getting auth fetch:', error);
    }
  }

  // Fallback to regular fetch
  return fetch;
}

/**
 * Listens for auth activation event when auth initializes after page load
 * @param callback - Called with authenticated fetch function when auth activates
 * @param eventName - Event name (defaults to 'sib-auth:activated')
 * @returns Cleanup function to remove listener
 */
export function onAuthActivated(
  callback: (event: any) => void,
  eventName = 'sib-auth:activated',
): () => void {
  const handler = (event: any) => {
    if (event.detail?.fetch && typeof event.detail.fetch === 'function') {
      callback(event);
    }
  };

  document.addEventListener(eventName, handler);

  // Return cleanup function
  return () => {
    document.removeEventListener(eventName, handler);
  };
}

/**
 * Waits for auth element to appear in DOM (uses MutationObserver)
 * @param selectors - CSS selectors to watch
 * @param timeout - Max wait time in ms (defaults to 5000)
 * @returns Promise resolving to auth element or rejecting on timeout
 */
export async function waitForAuthElement(
  selectors: string[] = [...DEFAULT_AUTH_SELECTORS],
  timeout = 5000,
): Promise<Element> {
  const existing = findAuthElement(selectors);
  if (existing) {
    return existing;
  }

  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const element = findAuthElement(selectors);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(
        new Error(
          `No auth element found with selectors: ${selectors.join(', ')}`,
        ),
      );
    }, timeout);
  });
}

export const AuthFetchResolver = {
  findAuthElement,
  getAuthFetch,
  onAuthActivated,
  waitForAuthElement,
};
