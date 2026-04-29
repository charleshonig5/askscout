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

/** Minimal terminal spinner — avoids ESM-only dependency on ora.
 *
 *  TTY guard: when stderr isn't a TTY (output redirected, CI, piped
 *  to another process), the animation is useless — frames just
 *  spam the log and the cursor-control ANSI escapes (\r, \x1b[K)
 *  show up as garbage in captured output. In that case we print
 *  the message once on stderr without animation and return a
 *  no-op stop(), so the caller's API is identical regardless of
 *  context. */
export function startSpinner(message: string): Spinner {
  if (!process.stderr.isTTY) {
    process.stderr.write(`${message}\n`);
    return { stop() {} };
  }

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
