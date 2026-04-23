/**
 * PostCSS configuration for Next.js. Wires up Tailwind v4 via the
 * `@tailwindcss/postcss` plugin. Tailwind config itself lives in
 * src/app/globals.css under `@theme inline { ... }` (Tailwind v4's
 * CSS-first configuration model).
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
