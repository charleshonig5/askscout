# askscout

## 0.2.3

### Patch Changes

- First-run UX: API key setup now happens BEFORE the scanning spinner starts so the "Hey, Scout here, paste your key" intro no longer interrupts an in-progress scan. Returning users (with a saved key) skip the prompt entirely and see no change.
- Generating-digest spinner now shows a time estimate ("usually 10–20 seconds") so users don't think the LLM call has hung at the 15-second mark.
- Dry-run, non-TTY, and existing-config code paths preserved verbatim.

## 0.2.2

### Patch Changes

- Stripped em dashes from all repository documentation, including the README that ships on the npm package page.
- Style-only change. No CLI behavior affected.

## 0.2.1

### Patch Changes

- Corrected the sample output in the README to match what the CLI actually prints. The previous sample showed a Unicode bar-chart timeline and a separate Stats block that the real renderer does not produce.
- Docs-only change. No CLI behavior affected.

## 0.2.0

### Minor Changes

- First self-contained release. The CLI now bundles `askscout-core` directly inside `dist/index.cjs` instead of declaring it as a runtime dependency. End users no longer need to install `askscout-core` separately.
- Added a `prepublishOnly` hook that runs a clean build plus the full test suite before any publish, so a broken or stale `dist/` can never ship.
- `askscout --version` now reads its version from `package.json` at bundle time (was previously hard-coded).

### Notes

- The companion package `askscout-core@0.1.0` is now deprecated on npm. Install `askscout` instead.

## 0.1.0

### Initial release

- First public version of the CLI on npm. Daily digest generation with Anthropic / OpenAI provider support, standup and resume output modes, weekly review (`--week`), JSON output, and dry-run preview.
