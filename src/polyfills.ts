// Minimal Node.js polyfills for browser environment - only what's actually needed
if (typeof window !== 'undefined') {
  // Process polyfill - needed by semantizer for stdout/stderr
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { 
      env: {},
      browser: true,
      stdout: { 
        write: (data: any) => console.log(data),
        pipe: (dest: any) => dest
      },
      stderr: { 
        write: (data: any) => console.error(data),
        pipe: (dest: any) => dest
      },
      nextTick: (callback: Function, ...args: any[]) => {
        // Use setTimeout with 0 delay to simulate nextTick
        setTimeout(() => callback(...args), 0);
      }
    };
  }
  
  // Global polyfill
  if (typeof (window as any).global === 'undefined') {
    (window as any).global = window;
  }
}

export {}; 