const FRAMES = [
  "\u280b",
  "\u2819",
  "\u2839",
  "\u2838",
  "\u283c",
  "\u2834",
  "\u2826",
  "\u2827",
  "\u2807",
  "\u280f",
];
const INTERVAL = 80;

export interface Spinner {
  stop(): void;
}

/** Minimal terminal spinner — avoids ESM-only dependency on ora */
export function startSpinner(message: string): Spinner {
  let i = 0;
  const timer = setInterval(() => {
    const frame = FRAMES[i % FRAMES.length]!;
    process.stderr.write(`\r${frame} ${message}`);
    i++;
  }, INTERVAL);

  return {
    stop() {
      clearInterval(timer);
      process.stderr.write("\r\x1b[K"); // clear the line
    },
  };
}
