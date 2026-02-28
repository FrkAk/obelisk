const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";

const COMPONENT_COLORS = [CYAN, MAGENTA, BLUE, GREEN, YELLOW];

let colorIndex = 0;
const colorMap = new Map<string, string>();

/**
 * Picks a consistent color for a component name from the palette.
 *
 * Args:
 *     component: The component name to assign a color to.
 *
 * Returns:
 *     ANSI color code for the component.
 */
function getComponentColor(component: string): string {
  const existing = colorMap.get(component);
  if (existing) return existing;

  const color = COMPONENT_COLORS[colorIndex % COMPONENT_COLORS.length];
  colorIndex++;
  colorMap.set(component, color);
  return color;
}

interface Logger {
  info: (...args: unknown[]) => void;
  success: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  timing: (label: string, ms: number) => void;
}

/**
 * Creates a colored console logger for a named component.
 *
 * Args:
 *     component: The component name shown in the log prefix.
 *
 * Returns:
 *     Logger object with info, success, warn, error, and timing methods.
 *
 * Example:
 *     const log = createLogger("search");
 *     log.info("Query:", query);
 *     log.timing("total", 724);
 */
/**
 * Formats a duration in milliseconds to a human-readable string.
 *
 * @param ms - Duration in milliseconds.
 * @returns Formatted string like "45s", "2m12s", or "1h3m".
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h${minutes}m`;
  if (minutes > 0) return `${minutes}m${seconds}s`;
  return `${seconds}s`;
}

/**
 * Formats an ETA progress string with elapsed time and remaining estimate.
 *
 * @param startMs - Timestamp (ms) when processing started.
 * @param done - Number of items completed so far.
 * @param total - Total number of items.
 * @returns Formatted string like "3/100 — 2m12s elapsed, ~14m remaining".
 */
export function formatEta(startMs: number, done: number, total: number): string {
  const elapsed = Date.now() - startMs;
  const elapsedStr = formatDuration(elapsed);

  if (done < 2) {
    return `${done}/${total} — ${elapsedStr} elapsed`;
  }

  const rate = elapsed / done;
  const remaining = rate * (total - done);
  return `${done}/${total} — ${elapsedStr} elapsed, ~${formatDuration(remaining)} remaining`;
}

export function createLogger(component: string): Logger {
  const color = getComponentColor(component);
  const prefix = `${color}${BOLD}[${component}]${RESET}`;

  return {
    info: (...args: unknown[]) => console.log(prefix, ...args),
    success: (...args: unknown[]) => console.log(prefix, `${GREEN}✓${RESET}`, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, `${YELLOW}⚠${RESET}`, ...args),
    error: (...args: unknown[]) => console.error(prefix, `${RED}✗${RESET}`, ...args),
    timing: (label: string, ms: number) => {
      const msColor = ms < 100 ? GREEN : ms < 1000 ? DIM : YELLOW;
      console.log(prefix, `${label} ${msColor}${ms}ms${RESET}`);
    },
  };
}
