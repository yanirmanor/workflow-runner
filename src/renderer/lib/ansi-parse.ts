interface AnsiSpan {
  text: string;
  style: React.CSSProperties;
}

const ANSI_REGEX = /\x1b\[([0-9;]*)m/g;

const COLORS: Record<number, string> = {
  30: '#6b7280', // black (gray for dark bg)
  31: '#ef4444', // red
  32: '#22c55e', // green
  33: '#eab308', // yellow
  34: '#3b82f6', // blue
  35: '#a855f7', // magenta
  36: '#06b6d4', // cyan
  37: '#d1d5db', // white
  90: '#9ca3af', // bright black (gray)
  91: '#f87171', // bright red
  92: '#4ade80', // bright green
  93: '#facc15', // bright yellow
  94: '#60a5fa', // bright blue
  95: '#c084fc', // bright magenta
  96: '#22d3ee', // bright cyan
  97: '#f3f4f6', // bright white
};

const BG_COLORS: Record<number, string> = {
  40: '#1f2937',
  41: '#991b1b',
  42: '#166534',
  43: '#854d0e',
  44: '#1e3a5f',
  45: '#6b21a8',
  46: '#155e75',
  47: '#e5e7eb',
};

export function parseAnsi(text: string): AnsiSpan[] {
  const spans: AnsiSpan[] = [];
  let currentStyle: React.CSSProperties = {};
  let lastIndex = 0;

  ANSI_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ANSI_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ text: text.slice(lastIndex, match.index), style: { ...currentStyle } });
    }
    lastIndex = match.index + match[0].length;

    const codes = match[1] ? match[1].split(';').map(Number) : [0];
    for (const code of codes) {
      if (code === 0) {
        currentStyle = {};
      } else if (code === 1) {
        currentStyle = { ...currentStyle, fontWeight: 'bold' };
      } else if (code === 2) {
        currentStyle = { ...currentStyle, opacity: 0.7 };
      } else if (code === 3) {
        currentStyle = { ...currentStyle, fontStyle: 'italic' };
      } else if (code === 4) {
        currentStyle = { ...currentStyle, textDecoration: 'underline' };
      } else if (code === 9) {
        currentStyle = { ...currentStyle, textDecoration: 'line-through' };
      } else if (code === 22) {
        const { fontWeight: _, ...rest } = currentStyle;
        currentStyle = rest;
      } else if (code === 23) {
        const { fontStyle: _, ...rest } = currentStyle;
        currentStyle = rest;
      } else if (code === 24 || code === 29) {
        const { textDecoration: _, ...rest } = currentStyle;
        currentStyle = rest;
      } else if (COLORS[code]) {
        currentStyle = { ...currentStyle, color: COLORS[code] };
      } else if (code === 39) {
        const { color: _, ...rest } = currentStyle;
        currentStyle = rest;
      } else if (BG_COLORS[code]) {
        currentStyle = { ...currentStyle, backgroundColor: BG_COLORS[code] };
      } else if (code === 49) {
        const { backgroundColor: _, ...rest } = currentStyle;
        currentStyle = rest;
      }
    }
  }

  if (lastIndex < text.length) {
    spans.push({ text: text.slice(lastIndex), style: { ...currentStyle } });
  }

  return spans;
}
