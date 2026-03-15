const COLORS = [
  '\x1b[36m',  // cyan
  '\x1b[33m',  // yellow
  '\x1b[35m',  // magenta
  '\x1b[32m',  // green
  '\x1b[34m',  // blue
  '\x1b[91m',  // bright red
  '\x1b[96m',  // bright cyan
  '\x1b[93m',  // bright yellow
];

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';

export function getNodeColor(index: number): string {
  return COLORS[index % COLORS.length];
}

export function bold(text: string): string {
  return `${BOLD}${text}${RESET}`;
}

export function dim(text: string): string {
  return `${DIM}${text}${RESET}`;
}

export function red(text: string): string {
  return `${RED}${text}${RESET}`;
}

export function green(text: string): string {
  return `${GREEN}${text}${RESET}`;
}

export function yellow(text: string): string {
  return `${YELLOW}${text}${RESET}`;
}

export function colorize(text: string, color: string): string {
  return `${color}${text}${RESET}`;
}

export function padRight(str: string, len: number): string {
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

export function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] || '').length))
  );

  const sep = colWidths.map((w) => '-'.repeat(w + 2)).join('+');
  const headerLine = headers.map((h, i) => ` ${padRight(h, colWidths[i])} `).join('|');
  const dataLines = rows.map((row) =>
    row.map((cell, i) => ` ${padRight(cell || '', colWidths[i])} `).join('|')
  );

  return [headerLine, sep, ...dataLines].join('\n');
}
