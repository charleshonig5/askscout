import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";

// Read the version straight from package.json at build time so the
// bundled bin can expose `askscout --version` without a runtime
// file read. The replacement happens via tsup's `define` option,
// which substitutes the literal string into the compiled JS.
const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  define: {
    __ASKSCOUT_VERSION__: JSON.stringify(pkg.version),
  },
});
