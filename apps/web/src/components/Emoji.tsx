"use client";

/**
 * Renders a Microsoft Fluent Emoji (3D variation) as an <img>. Assets are
 * pulled from the official repo via jsdelivr — no bundle impact, cached at
 * the CDN edge.
 *
 * Repo: https://github.com/microsoft/fluentui-emoji (MIT license)
 *
 * Why a named lookup instead of passing Unicode characters directly:
 *   1. Asset filenames don't map cleanly from the character. "🚀" is trivial
 *      (/Rocket/3D/rocket_3d.png) but "🩺" is /Stethoscope/3D/stethoscope_3d.png
 *      — decoding character → folder name requires a lookup anyway, and
 *      explicit names are easier to read in JSX.
 *   2. Semantic names (section keys like "vibe", "shipped") pair with the
 *      existing SECTION_MARKERS / SIDEBAR_SKELETONS keys so callers don't
 *      need a separate mapping layer.
 */

const BASE = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";

interface EmojiAsset {
  /** Folder in the Fluent Emoji repo (Title Case with spaces). */
  folder: string;
  /** PNG filename inside the folder's 3D/ subfolder. */
  file: string;
}

/**
 * Every emoji used in the UI, keyed by the semantic name askscout uses
 * internally. Adding a new emoji: pick a name, find the matching folder
 * in the Fluent Emoji repo, add an entry.
 */
const EMOJI_MAP: Record<string, EmojiAsset> = {
  // Digest narrative section headers
  vibe: { folder: "Megaphone", file: "megaphone_3d.png" },
  shipped: { folder: "Rocket", file: "rocket_3d.png" },
  changed: { folder: "Hammer and wrench", file: "hammer_and_wrench_3d.png" },
  unstable: { folder: "Clockwise vertical arrows", file: "clockwise_vertical_arrows_3d.png" },
  leftOff: { folder: "Round pushpin", file: "round_pushpin_3d.png" },
  takeaway: { folder: "Key", file: "key_3d.png" },
  // Computed stat section headers
  statistics: { folder: "Bar chart", file: "bar_chart_3d.png" },
  mostActiveFiles: { folder: "File folder", file: "file_folder_3d.png" },
  whenYouCoded: { folder: "One oclock", file: "one_oclock_3d.png" },
  paceCheck: { folder: "High voltage", file: "high_voltage_3d.png" },
  codebaseHealth: { folder: "Stethoscope", file: "stethoscope_3d.png" },
  // Misc UI
  streak: { folder: "Fire", file: "fire_3d.png" },
  quietDay: { folder: "Hot beverage", file: "hot_beverage_3d.png" },
};

export type EmojiName = keyof typeof EMOJI_MAP;

interface EmojiProps {
  name: string;
  size?: number;
  className?: string;
  /** Override alt text. Default is empty (emoji are decorative). */
  alt?: string;
}

export function Emoji({ name, size = 18, className = "", alt = "" }: EmojiProps) {
  const asset = EMOJI_MAP[name];
  if (!asset) return null;

  const url = `${BASE}/${encodeURIComponent(asset.folder)}/3D/${asset.file}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      className={`emoji ${className}`.trim()}
    />
  );
}
