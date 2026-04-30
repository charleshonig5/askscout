import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      // v8 coverage is the modern default — no instrumentation step,
      // works directly off the runtime profile data.
      provider: "v8",
      // Limit coverage measurement to library source.
      include: ["src/**/*.ts"],
      // Excluded from coverage:
      //   - Test files themselves
      //   - The barrel (just re-exports)
      //   - types.ts (interface / type declarations only, no
      //     runtime code to cover)
      exclude: ["src/**/*.test.ts", "src/__tests__/**", "src/index.ts", "src/types.ts"],
      // Multiple reporters: 'text' for local terminal, 'lcov' for CI
      // tooling that wants a standard format, 'html' for clickable
      // local exploration when debugging coverage gaps.
      reporter: ["text", "lcov", "html"],
      // Thresholds enforce a minimum bar going forward. Set under the
      // current measured floor so honest regressions trip the build
      // but minor refactors aren't blocked. The floors reflect that
      // two files in core are integration-testing territory, not
      // unit-testing:
      //   - git.ts: shells out to the local `git` binary via execFile
      //   - summarize.ts: makes real LLM API calls to Anthropic /
      //     OpenAI in its core path
      // Both pull global lines/statements percentages down; the
      // tested deterministic helpers (format.ts, state.ts, the
      // prompt builders + computeStats in summarize.ts) sit at
      // 90%+ individually.
      thresholds: {
        lines: 50,
        statements: 50,
        functions: 80,
        branches: 90,
      },
    },
  },
});
