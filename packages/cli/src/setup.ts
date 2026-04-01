import readline from "node:readline/promises";
import { detectProvider, saveConfig } from "./config.js";

/** Run interactive setup — prompt for API key, detect provider, save config */
export async function runSetup(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  try {
    console.error("\naskscout setup\n");
    const apiKey = await rl.question("Enter your API key (Anthropic sk-ant-* or OpenAI sk-*): ");

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
      process.exitCode = 1;
      return;
    }

    await saveConfig({ provider, apiKey: trimmed });
    console.error(`\n\u2713 Saved! Provider: ${provider}. Run \`askscout\` in any git repo.\n`);
  } finally {
    rl.close();
  }
}
