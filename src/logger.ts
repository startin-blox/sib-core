import log from 'loglevel';

const colors = {
  reset: '\x1b[0m',
  trace: '\x1b[38;2;169;169;169m', // Gray
  debug: '\x1b[38;2;0;0;255m', // Blue
  info: '\x1b[38;2;0;128;0m', // Green
  warn: '\x1b[38;2;218;165;32m', // Yellow
  error: '\x1b[38;2;255;0;0m', // Red
};

function formatMessage(level, messages) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;

  // Convert each message to a string, including objects
  const formattedMessages = messages
    .map(msg => {
      if (typeof msg === 'object') {
        try {
          return JSON.stringify(msg, null, 2);
        } catch (error) {
          return String(msg);
        }
      }
      return String(msg);
    })
    .join(' ');

  return `${color}[${timestamp}] ${formattedMessages}${colors.reset}`;
}

var originalFactory = log.methodFactory;

log.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  return (...messages) => {
    rawMethod(formatMessage(methodName, messages));
  };
};

// Manage the DEBUG environment variable
if (import.meta.env?.VITE_DEBUG === 'True') {
  log.setLevel('debug');
} else {
  log.setLevel('warn');
}

// Async HOF to log render times and time execution
export function trackRenderAsync(fn: Function, context?: string) {
  return async function (...args: any[]) {
    let componentName = context
      ? context
      : this.name
        ? this.name
        : this.constructor.name;
    if (this.element.id) {
      componentName += ` (id: ${this.element.id})`;
    } else if (this.dataSrc) {
      componentName += ` (data-src: ${this.dataSrc})`;
    } else if (this.resourceId) {
      componentName += ` (resourceId: ${this.resourceId})`;
    }

    const startTime = performance.now();
    const result = await fn.apply(this, args);
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (this.profiler) {
      this.profiler.updateStats(componentName, renderTime);
      this.profiler.printStats();
    } else {
      log.debug(
        `Component ${componentName} rendered in ${renderTime.toFixed(2)} ms`,
      );
    }

    return result;
  };
}

// HOF to log render times and time execution
export function trackRender(fn: Function, context?: string) {
  return async function (...args: any[]) {
    let componentName = context
      ? context
      : this.name
        ? this.name
        : this.constructor.name;

    if (this.element.id) {
      componentName += ` (id: ${this.element.id})`;
    } else if (this.dataSrc) {
      componentName += ` (data-src: ${this.dataSrc})`;
    } else if (this.resourceId) {
      componentName += ` (resourceId: ${this.resourceId})`;
    }

    const startTime = performance.now();
    const result = fn.apply(this, args);
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (this.profiler) {
      this.profiler.updateStats(componentName, renderTime);
      this.profiler.printStats();
    } else {
      log.debug(
        `Component ${componentName} rendered in ${renderTime.toFixed(2)} ms`,
      );
    }

    return result;
  };
}

export type PerformanceMetrics = {
  renderCount: number; // Combien de fois le composant a été rendu
  totalExecutionTime: number; // Temps total d'exécution (en ms)
  lastExecutionTime: number; // Temps d'exécution lors du dernier rendu
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
};

export class Profiler {
  private stats: { [componentName: string]: PerformanceMetrics } = {};

  constructor() {
    this.stats = {};
  }

  private getOrCreateStats(componentName: string): PerformanceMetrics {
    if (!this.stats[componentName]) {
      this.stats[componentName] = {
        renderCount: 0,
        totalExecutionTime: 0,
        lastExecutionTime: 0,
        averageExecutionTime: 0,
        minExecutionTime: Infinity,
        maxExecutionTime: 0,
      };
    }
    return this.stats[componentName];
  }

  public getStats(componentName: string): PerformanceMetrics | undefined {
    return this.stats[componentName];
  }

  public updateStats(componentName: string, renderTime: number): void {
    const stats = this.getOrCreateStats(componentName);
    stats.renderCount++;
    stats.lastExecutionTime = renderTime;
    stats.totalExecutionTime += renderTime;
    stats.averageExecutionTime = stats.totalExecutionTime / stats.renderCount;
    stats.minExecutionTime = Math.min(stats.minExecutionTime, renderTime);
    stats.maxExecutionTime = Math.max(stats.maxExecutionTime, renderTime);
  }

  private formatTime(time: number): string {
    if (time >= 1000) {
      return `${(time / 1000).toFixed(2)} seconds`;
    } else {
      return `${time.toFixed(2)} ms`;
    }
  }

  private formatComponentStats(
    componentName: string,
    stats: PerformanceMetrics,
  ): string {
    return (
      `\nComponent: ${componentName}\n` +
      `  Render Count: ${stats.renderCount}\n` +
      `  Total Execution Time: ${this.formatTime(stats.totalExecutionTime)}\n` +
      `  Last Execution Time: ${this.formatTime(stats.lastExecutionTime)}\n` +
      `  Average Execution Time: ${this.formatTime(stats.averageExecutionTime)}\n` +
      `  Min Execution Time: ${this.formatTime(stats.minExecutionTime)}\n` +
      `  Max Execution Time: ${this.formatTime(stats.maxExecutionTime)}\n`
    );
  }

  public printStats(componentName: string): void {
    let output = 'Component Performance Stats:\n';

    if (componentName) {
      const stats = this.stats[componentName];
      if (!stats) {
        output += `Component ${componentName} not found.\n`;
      } else {
        output += this.formatComponentStats(componentName, stats);
      }
    } else {
      for (const [name, stats] of Object.entries(this.stats)) {
        output += this.formatComponentStats(name, stats);
      }
    }
    log.debug(output);
  }
}

export { log as logger };
