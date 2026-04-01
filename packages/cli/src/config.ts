import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AiProvider } from "@askscout/core";

const CONFIG_DIR = path.join(os.homedir(), ".askscout");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const MIN_KEY_LENGTH = 20;

export interface CliConfig {
  provider: AiProvider;
  apiKey: string;
  model?: string;
}

/** Detect AI provider from API key format */
export function detectProvider(apiKey: string): AiProvider {
  if (apiKey.length < MIN_KEY_LENGTH) {
    throw new Error("API key is too short. Check that you pasted the full key.");
  }
  if (apiKey.startsWith("sk-ant-")) return "anthropic";
  if (apiKey.startsWith("sk-")) return "openai";
  throw new Error("Invalid API key format. Expected sk-ant-* (Anthropic) or sk-* (OpenAI).");
}

/** Load CLI config from ~/.askscout/config.json */
export async function loadConfig(): Promise<CliConfig | null> {
  let raw: string;
  try {
    raw = await fs.readFile(CONFIG_FILE, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const obj = parsed as Record<string, unknown>;
  if (typeof obj.provider !== "string" || typeof obj.apiKey !== "string") return null;

  return {
    provider: obj.provider as AiProvider,
    apiKey: obj.apiKey,
    model: typeof obj.model === "string" ? obj.model : undefined,
  };
}

/** Save CLI config to ~/.askscout/config.json with secure permissions */
export async function saveConfig(config: CliConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const content = JSON.stringify(config, null, 2) + "\n";
  await fs.writeFile(CONFIG_FILE, content, { encoding: "utf-8", mode: 0o600 });
}
