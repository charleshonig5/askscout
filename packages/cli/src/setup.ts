import type { CliConfig } from "./config.js";
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
        stdin.removeListener("data", onData);
        if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
        stdin.pause();
        process.stderr.write("\n");
        resolve(input);
      } else if (c === "\u007f" || c === "\b") {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stderr.write("\b \b");
        }
      } else if (c === "\u0003") {
        process.stderr.write("\n");
        process.exit(1);
      } else if (c >= " ") {
        input += c;
        process.stderr.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

/** Prompt for API key and save config. Returns the config or null if cancelled. */
async function promptForKey(): Promise<CliConfig | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const apiKey = await readMaskedInput("Enter your API key: ");
    const trimmed = apiKey.trim();

    if (!trimmed) {
      return null;
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
      return null;
    }

    const config: CliConfig = { provider, apiKey: trimmed };
    await saveConfig(config);
    console.error(`\n\u2713 Saved to ~/.askscout/config.json (provider: ${provider})\n`);
    return config;
  }
  return null;
}

/** Standalone setup — run via `askscout --setup` */
export async function runSetup(): Promise<void> {
  console.error("\naskscout setup\n");
  console.error("askscout supports two LLM providers. Bring an API key from either one.");
  console.error(
    "Your key stays on this machine and is never sent anywhere except your chosen provider.\n",
  );

  const config = await promptForKey();
  if (!config) {
    console.error("Setup cancelled.");
    process.exitCode = 1;
    return;
  }
  console.error("Run `askscout` in any git repo to get your first digest.\n");
}

/** Inline setup — called during first run when no key exists. Returns config or null. */
export async function inlineSetup(): Promise<CliConfig | null> {
  console.error("Hey! Scout here. Your daily digest for what's happening in your repo.\n");
  console.error("   I need an LLM API key to get started. Two providers are supported:\n");
  console.error("   • Keys starting with sk-ant-  →  one provider (typically slightly cheaper)");
  console.error("   • Keys starting with sk-      →  the other provider\n");
  console.error("   Either works. Paste your key when prompted.");
  console.error(
    "   Your key stays on this machine and is never sent anywhere except your chosen provider.\n",
  );

  const config = await promptForKey();
  if (!config) {
    console.error("No worries. Run askscout --setup when you're ready.\n");
  }
  return config;
}
