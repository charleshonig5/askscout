import { detectProvider, saveConfig } from "./config.js";

const MAX_ATTEMPTS = 3;

/** Read a line from stdin with masked echo (shows asterisks) */
function readMaskedInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stderr.write(prompt);

    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf-8");

    let input = "";

    const onData = (ch: string) => {
      const c = ch.toString();

      if (c === "\n" || c === "\r") {
        // Enter pressed
        stdin.removeListener("data", onData);
        if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
        stdin.pause();
        process.stderr.write("\n");
        resolve(input);
      } else if (c === "\u007f" || c === "\b") {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stderr.write("\b \b");
        }
      } else if (c === "\u0003") {
        // Ctrl+C
        process.stderr.write("\n");
        process.exit(1);
      } else if (c >= " ") {
        // Printable character
        input += c;
        process.stderr.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

/** Run interactive setup — prompt for API key, detect provider, save config */
export async function runSetup(): Promise<void> {
  console.error("\naskscout setup\n");
  console.error("Get a key at: console.anthropic.com or platform.openai.com\n");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const apiKey = await readMaskedInput("Enter your API key: ");
    const trimmed = apiKey.trim();

    if (!trimmed) {
      console.error("No key entered. Setup cancelled.");
      process.exitCode = 1;
      return;
    }

    let provider: ReturnType<typeof detectProvider>;
    try {
      provider = detectProvider(trimmed);
    } catch (err) {
      console.error(`\u2717 ${(err as Error).message}`);
      if (attempt < MAX_ATTEMPTS) {
        console.error(
          `   Try again (${MAX_ATTEMPTS - attempt} ${MAX_ATTEMPTS - attempt === 1 ? "attempt" : "attempts"} left).\n`,
        );
        continue;
      }
      console.error("   Run askscout --setup to try again.");
      process.exitCode = 1;
      return;
    }

    await saveConfig({ provider, apiKey: trimmed });
    console.error(`\n\u2713 Saved to ~/.askscout/config.json`);
    console.error(`  Provider: ${provider}`);
    console.error(`  Run \`askscout\` in any git repo.\n`);
    return;
  }
}
