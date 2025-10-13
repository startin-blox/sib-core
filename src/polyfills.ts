// Minimal Node.js polyfills for browser environment - only what's actually needed
if (typeof window !== 'undefined') {
  // Process polyfill - needed by semantizer for stdout/stderr
  if (
    typeof (window as unknown as Record<string, unknown>).process ===
    'undefined'
  ) {
    (window as unknown as Record<string, unknown>).process = {
      env: {},
      browser: true,
      stdout: {
        write: (data: unknown) => console.log(data),
        pipe: (dest: unknown) => dest,
      },
      stderr: {
        write: (data: unknown) => console.error(data),
        pipe: (dest: unknown) => dest,
      },
      nextTick: (
        callback: (...args: unknown[]) => void,
        ...args: unknown[]
      ) => {
        // Use setTimeout with 0 delay to simulate nextTick
        setTimeout(() => callback(...args), 0);
      },
    };
  }

  // Global polyfill
  if (
    typeof (window as unknown as Record<string, unknown>).global === 'undefined'
  ) {
    (window as unknown as Record<string, unknown>).global = window;
  }
}

export {};
